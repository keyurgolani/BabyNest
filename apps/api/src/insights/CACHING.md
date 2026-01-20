# AI Health Summary Caching

## Overview

The AI health summary endpoint (`/insights/trends/daily`) now implements Redis caching to prevent duplicate AI generation requests when users repeatedly open the home page.

## Cache Configuration

Cache TTL (Time-To-Live) varies by insight period:

- **Daily insights**: 15 minutes
- **Weekly insights**: 1 hour
- **Monthly insights**: 2 hours
- **Yearly insights**: 4 hours

## How It Works

1. When a user requests AI health insights, the system first checks Redis cache using a key based on:
   - Baby ID
   - Period type (daily/weekly/monthly/yearly)
   - Period start date
   - Period end date

2. **Cache Hit**: If valid cached data exists, it's returned immediately without calling the AI service.

3. **Cache Miss**: If no cached data exists or it has expired:
   - Fresh insights are generated (including AI analysis if available)
   - The result is stored in Redis with the appropriate TTL
   - The result is returned to the user

## Benefits

- **Reduced AI API calls**: Prevents redundant AI generation for the same time period
- **Faster response times**: Cached responses are returned in milliseconds
- **Better user experience**: Home page loads faster on repeated visits
- **Cost optimization**: Reduces unnecessary AI processing

## Cache Key Format

```
insights:trends:{babyId}:{period}:{startDate}:{endDate}
```

Example:

```
insights:trends:baby-123:daily:2026-01-17:2026-01-17
```

## Graceful Degradation

- If Redis is unavailable, the system continues to work normally without caching
- Cache failures are logged but don't affect the user experience
- The service automatically falls back to generating fresh insights

## Cache Invalidation

Cache entries automatically expire based on their TTL. For daily insights requested for "today", the cache will be valid for 15 minutes, ensuring users see relatively fresh data while avoiding excessive AI calls.

## Monitoring

Check logs for cache performance:

- `Cache hit for trend insights: {cacheKey}` - Successful cache retrieval
- `Cached trend insights for {period} period (TTL: {seconds}s): {cacheKey}` - Successful cache storage
- `Failed to cache insights: {error}` - Cache storage failure (non-critical)
