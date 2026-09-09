# Quick Test: Pagination Format
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Default Pagination Format" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Default (should have pagination metadata)
Write-Host "[TEST 1] GET /api/hero-slides (Default)" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:5000/api/hero-slides"
    
    Write-Host "✓ Success: $($result.success)" -ForegroundColor Green
    Write-Host "✓ Data is array: $($result.data -is [Array])" -ForegroundColor Green
    Write-Host "✓ Has metadata: $($null -ne $result.metadata)" -ForegroundColor Green
    
    if ($result.metadata) {
        Write-Host "  - Page: $($result.metadata.page)" -ForegroundColor Cyan
        Write-Host "  - Limit: $($result.metadata.limit)" -ForegroundColor Cyan
        Write-Host "  - Total: $($result.metadata.total)" -ForegroundColor Cyan
        Write-Host "  - Total Pages: $($result.metadata.total_pages)" -ForegroundColor Cyan
    }
    
    Write-Host "✓ Data count: $($result.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Custom pagination
Write-Host "`n[TEST 2] GET /api/hero-slides?page=1&limit=5" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:5000/api/hero-slides?page=1&limit=5"
    
    Write-Host "✓ Success: $($result.success)" -ForegroundColor Green
    Write-Host "✓ Page: $($result.metadata.page)" -ForegroundColor Green
    Write-Host "✓ Limit: $($result.metadata.limit)" -ForegroundColor Green
    Write-Host "✓ Data count: $($result.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: With filter
Write-Host "`n[TEST 3] GET /api/hero-slides?is_active=true" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "http://localhost:5000/api/hero-slides?is_active=true"
    
    Write-Host "✓ Success: $($result.success)" -ForegroundColor Green
    Write-Host "✓ Has metadata: $($null -ne $result.metadata)" -ForegroundColor Green
    Write-Host "✓ Total active: $($result.metadata.total)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
