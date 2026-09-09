param(
  [string]$BaseUrl = 'https://findtax.kr',
  [string]$BuildDirectory = '.next'
)

$ErrorActionPreference = 'Stop'
$base = $BaseUrl.TrimEnd('/')
$manifestPath = Join-Path $BuildDirectory 'prerender-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
$expectedBlogs = @($manifest.routes.PSObject.Properties.Name |
  Where-Object { $_.StartsWith('/blog/') } |
  ForEach-Object { [Uri]::UnescapeDataString($_) } | Sort-Object -Unique)
if ($expectedBlogs.Count -eq 0) { throw 'Build has no blog routes to verify.' }

function Get-PublicPage([string]$Url) {
  $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 45
  if ($response.StatusCode -ne 200) { throw "Unexpected status for $Url" }
  return $response
}

[xml]$sitemap = (Get-PublicPage "$base/sitemap.xml").Content
$entries = @($sitemap.urlset.url)
$paths = @($entries | ForEach-Object { [Uri]::UnescapeDataString(([Uri]$_.loc).AbsolutePath) })
if (@($paths | Sort-Object -Unique).Count -ne $paths.Count) { throw 'Duplicate sitemap URLs.' }
if (@($paths | Where-Object { $_ -match '^/region/|^/register/?$' }).Count) {
  throw 'Excluded region or registration route is in sitemap.'
}
$publishedBlogs = @($paths | Where-Object { $_.StartsWith('/blog/') } | Sort-Object -Unique)
$difference = @(Compare-Object $expectedBlogs $publishedBlogs)
if ($difference.Count) { throw "Blog URL mismatch: $($difference | ConvertTo-Json -Compress)" }

$homeHtml = (Get-PublicPage "$base/").Content
if ($homeHtml -notmatch 'id="starter-guides-title"') { throw 'New home guide section is missing.' }
if ($homeHtml -match 'ads-partners\.coupang\.com|adsbygoogle\.js|class="adsbygoogle') {
  throw 'Global display advertising is still present.'
}
if ($homeHtml -notmatch 'google-adsense-account') { throw 'AdSense ownership metadata is missing.' }

$checkedBlogs = 0
foreach ($entry in $entries) {
  $path = [Uri]::UnescapeDataString(([Uri]$entry.loc).AbsolutePath)
  if (-not $path.StartsWith('/blog/')) { continue }
  $response = Get-PublicPage "$base$path"
  $html = $response.Content
  if ($html -match '<meta[^>]+name="robots"[^>]+content="[^"]*noindex') {
    throw "Noindex blog is included in sitemap: $path"
  }
  $article = $null
  foreach ($match in [regex]::Matches($html, '<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', 'Singleline')) {
    $data = $match.Groups[1].Value | ConvertFrom-Json
    if ($data.'@type' -eq 'Article') { $article = $data; break }
  }
  if (-not $article) { throw "Article schema missing: $path" }
  if (([datetime]$entry.lastmod).Date -ne ([datetime]$article.dateModified).Date) {
    throw "Sitemap and article modification dates disagree: $path"
  }
  if ($html -notmatch 'href="#section-1"') { throw "Article contents missing: $path" }
  $checkedBlogs++
}

$corePaths = @('/calculator', '/calculator/retirement-income', '/consult', '/about', '/editorial-policy', '/privacy', '/terms', '/support')
foreach ($path in $corePaths) { $null = Get-PublicPage "$base$path" }
$retirementEntry = @($entries | Where-Object {
  [Uri]::UnescapeDataString(([Uri]$_.loc).AbsolutePath) -eq '/calculator/retirement-income'
})
if ($retirementEntry.Count -ne 1) { throw 'Retirement calculator must appear exactly once in sitemap.' }
$retirementHtml = (Get-PublicPage "$base/calculator/retirement-income").Content
if ($retirementHtml -notmatch '노후월급 계산기' -or $retirementHtml -notmatch 'WebApplication') {
  throw 'Retirement calculator content or structured data is missing.'
}
$robots = (Get-PublicPage "$base/robots.txt").Content
$sitemapDeclaration = [regex]::Match($robots, '(?m)^Sitemap:\s*(\S+)\s*$')
if (-not $sitemapDeclaration.Success) { throw 'Sitemap declaration missing.' }
$declaredSitemap = [Uri]$sitemapDeclaration.Groups[1].Value
if ($declaredSitemap.AbsolutePath -ne '/sitemap.xml') { throw 'Sitemap declaration points to an unexpected path.' }
$baseUri = [Uri]$base
if (-not $baseUri.IsLoopback -and $declaredSitemap.Host -ne $baseUri.Host) {
  throw 'Sitemap declaration points to a different production host.'
}
$ads = (Get-PublicPage "$base/ads.txt").Content
if ($ads -notmatch 'pub-8715120205322652') { throw 'Publisher entry missing from ads.txt.' }

[pscustomobject]@{
  BaseUrl = $base
  SitemapUrls = $entries.Count
  BlogUrlsVerified = $checkedBlogs
  MissingBlogUrls = $difference.Count
  ExcludedRegionUrlsInSitemap = 0
  CorePagesVerified = $corePaths.Count
  DisplayAdsInHome = $false
  ArticleDatesMatchSitemap = $true
} | ConvertTo-Json
