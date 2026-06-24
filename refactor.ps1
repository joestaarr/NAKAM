$ErrorActionPreference = "Stop"
$src = Join-Path $PWD "src"

Write-Host "Creating directories..."
$dirs = @("pages", "components", "components/ui", "components/figma", "store", "services", "utils", "types", "data")
foreach ($d in $dirs) {
    $path = Join-Path $src $d
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
    }
}

Write-Host "Moving files..."
$moves = @(
    @("app/store.tsx", "store/store.tsx"),
    @("app/data.ts", "data/mockData.ts"),
    @("app/supabase.ts", "services/supabase.ts"),
    @("app/supabaseData.ts", "services/supabaseData.ts"),
    @("app/App.tsx", "App.tsx"),
    @("app/components/AdminPanel.tsx", "pages/AdminPanel.tsx"),
    @("app/components/HistoryTab.tsx", "pages/HistoryTab.tsx"),
    @("app/components/HomeMap.tsx", "pages/HomeMap.tsx"),
    @("app/components/HomeTab.tsx", "pages/HomeTab.tsx"),
    @("app/components/Login.tsx", "pages/Login.tsx"),
    @("app/components/MerchantDashboard.tsx", "pages/MerchantDashboard.tsx"),
    @("app/components/Profile.tsx", "pages/Profile.tsx"),
    @("app/components/RestaurantsTab.tsx", "pages/RestaurantsTab.tsx"),
    @("app/components/Navigator.tsx", "pages/Navigator.tsx"),
    @("app/components/BottomNavBar.tsx", "components/BottomNavBar.tsx"),
    @("app/components/Logo.tsx", "components/Logo.tsx"),
    @("app/components/Splash.tsx", "components/Splash.tsx"),
    @("app/components/Wallet.tsx", "components/Wallet.tsx"),
    @("app/components/EateryDetail.tsx", "components/EateryDetail.tsx")
)

foreach ($move in $moves) {
    $from = Join-Path $src $move[0]
    $to = Join-Path $src $move[1]
    if (Test-Path $from) {
        Move-Item -Path $from -Destination $to -Force
    }
}

Write-Host "Moving ui and figma folders..."
if (Test-Path (Join-Path $src "app/components/ui")) {
    Copy-Item -Path (Join-Path $src "app/components/ui/*") -Destination (Join-Path $src "components/ui") -Recurse -Force
}
if (Test-Path (Join-Path $src "app/components/figma")) {
    Copy-Item -Path (Join-Path $src "app/components/figma/*") -Destination (Join-Path $src "components/figma") -Recurse -Force
}

Write-Host "Cleaning up old directories..."
if (Test-Path (Join-Path $src "app")) {
    Remove-Item -Path (Join-Path $src "app") -Recurse -Force
}

Write-Host "Updating imports..."
$importMap = @{
    "store" = "@/store/store"
    "data" = "@/data/mockData"
    "supabase" = "@/services/supabase"
    "supabaseData" = "@/services/supabaseData"
    "AdminPanel" = "@/pages/AdminPanel"
    "HistoryTab" = "@/pages/HistoryTab"
    "HomeMap" = "@/pages/HomeMap"
    "HomeTab" = "@/pages/HomeTab"
    "Login" = "@/pages/Login"
    "MerchantDashboard" = "@/pages/MerchantDashboard"
    "Profile" = "@/pages/Profile"
    "RestaurantsTab" = "@/pages/RestaurantsTab"
    "Navigator" = "@/pages/Navigator"
    "BottomNavBar" = "@/components/BottomNavBar"
    "Logo" = "@/components/Logo"
    "Splash" = "@/components/Splash"
    "Wallet" = "@/components/Wallet"
    "EateryDetail" = "@/components/EateryDetail"
    "fmtRp" = "@/utils/format"
}

$files = Get-ChildItem -Path $src -Recurse -Include *.ts, *.tsx
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $updated = $false

    # Complex regex replace in PS is slow, let's use a simpler approach
    # We will search for 'from "../something"' and 'from "./something"'
    # And replace the exact matches
    $pattern = 'from\s+["''](\.\.?/[^"'']+)["'']'
    $newContent = [regex]::Replace($content, $pattern, {
        param($match)
        $importPath = $match.Groups[1].Value
        $basename = [System.IO.Path]::GetFileNameWithoutExtension($importPath)
        
        if ($importMap.ContainsKey($basename)) {
            return 'from "' + $importMap[$basename] + '"'
        }
        
        if ($importPath -match '/ui/') {
            return 'from "@/components/ui/' + $basename + '"'
        }
        if ($importPath -match '/figma/') {
            return 'from "@/components/figma/' + $basename + '"'
        }
        
        return $match.Value
    })

    if ($file.Name -eq "main.tsx") {
        $newContent = $newContent -replace 'from ["'']\.\/app\/App["'']', 'from "./App"'
    }

    if ($newContent -cne $content) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}

Write-Host "Refactoring done!"
