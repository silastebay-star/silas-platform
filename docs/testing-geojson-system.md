# GeoJSON Integration System Testing Guide

This document provides comprehensive testing coverage for the GeoJSON integration system, including census data overlays, community boundaries, and geographic data visualization.

## Overview

The GeoJSON integration system includes:
- **Census Data Service**: Handles demographic and statistical data
- **Community Boundaries**: Manages geographic boundaries and administrative areas
- **Geographic Layers**: Supports multiple overlay types (transport, environment, etc.)
- **Points of Interest**: Manages location-based community features
- **Map Integration**: Interactive map overlays and visualizations
- **Data Visualization**: Charts and statistics for demographic data

## Test Structure

### Unit Tests
Located in `*/__tests__/` directories alongside source files:

- `lib/services/__tests__/geojson-service.test.ts`
- `hooks/__tests__/useGeoJSONData.test.ts`
- `components/map/__tests__/GeoJSONOverlay.test.tsx`
- `components/map/__tests__/CensusDataVisualization.test.tsx`

### Integration Tests
Located in `__tests__/integration/`:

- `geojson-integration.test.ts` - Tests complete data flow and service integration

### End-to-End Tests
Located in `__tests__/e2e/`:

- `geojson-system.e2e.test.ts` - Tests complete user workflows and UI interactions

## Running Tests

### Quick Start
```bash
# Run all GeoJSON tests
npm run test:geojson

# Run specific test types
npm run test:geojson:unit
npm run test:geojson:integration
npm run test:geojson:e2e

# Run with coverage
npm run test:geojson:coverage

# Run in watch mode
npm run test:geojson:watch
```

### Advanced Usage
```bash
# Run specific test files
npx jest lib/services/__tests__/geojson-service.test.ts

# Run tests with verbose output
npm run test:geojson -- --verbose

# Run tests and stop on first failure
npm run test:geojson -- --bail

# Run only unit and integration tests
npm run test:geojson -- --unit --integration
```

## Test Coverage

### GeoJSON Service (`lib/services/geojson-service.ts`)

**Covered Functionality:**
- ✅ Census data retrieval with and without bounds
- ✅ Community boundaries filtering by type
- ✅ Geographic layers with visibility filtering
- ✅ Demographic heatmap generation
- ✅ Points of interest categorization
- ✅ Community statistics calculation
- ✅ Error handling for API failures
- ✅ Spatial query operations

**Test Cases:**
- Data retrieval with various parameters
- Error handling and graceful degradation
- Data transformation and aggregation
- Spatial filtering and bounds checking
- Performance with large datasets

### GeoJSON Data Hook (`hooks/useGeoJSONData.ts`)

**Covered Functionality:**
- ✅ Auto-loading data on mount
- ✅ Manual data loading with custom parameters
- ✅ Overlay configuration management
- ✅ Loading and error states
- ✅ Data availability indicators
- ✅ Demographic data extraction
- ✅ Area statistics calculation

**Test Cases:**
- Hook initialization and state management
- Data loading with different configurations
- Error handling and recovery
- Configuration updates and toggles
- Data transformation and memoization

### GeoJSON Overlay Component (`components/map/GeoJSONOverlay.tsx`)

**Covered Functionality:**
- ✅ Map layer initialization and cleanup
- ✅ Overlay visibility toggling
- ✅ Demographic metric selection
- ✅ Interactive map features
- ✅ Loading states and error handling
- ✅ Legend and statistics display

**Test Cases:**
- Component rendering and visibility
- User interactions and state changes
- Map layer management
- Data loading and display
- Responsive behavior

### Census Data Visualization (`components/map/CensusDataVisualization.tsx`)

**Covered Functionality:**
- ✅ Tabbed interface navigation
- ✅ Data visualization with charts
- ✅ Area selection and comparison
- ✅ Responsive design
- ✅ Data formatting and display

**Test Cases:**
- Component rendering with different data
- Tab navigation and content switching
- Data visualization accuracy
- User interaction handling

## Integration Test Scenarios

### Data Flow Integration
- Census data → Community statistics calculation
- Boundary data → Spatial filtering
- Multiple data sources → Unified visualization
- API errors → Graceful fallbacks

### Service Integration
- GeoJSON service ↔ Supabase database
- Hook ↔ Service layer communication
- Component ↔ Hook data binding
- Map ↔ Overlay integration

### Performance Integration
- Large dataset handling
- Memory usage optimization
- Rendering performance
- API response times

## End-to-End Test Scenarios

### User Workflows
1. **Map Exploration**
   - Load map with default view
   - Toggle GeoJSON overlay panel
   - Enable/disable different overlay types
   - Interact with map features

2. **Data Visualization**
   - View community statistics
   - Switch between demographic metrics
   - Explore different data categories
   - Compare areas and boundaries

3. **Responsive Behavior**
   - Mobile device compatibility
   - Touch interactions
   - Responsive layout adaptation
   - Performance on different devices

### Error Scenarios
- Network failures during data loading
- Invalid or malformed data handling
- Missing dependencies or configuration
- Browser compatibility issues

## Test Data

### Mock Census Data
```javascript
{
  id: 'census-1',
  name: 'Stoneclough Central',
  population: 2847,
  households: 1203,
  median_age: 42.3,
  median_income: 28500,
  unemployment_rate: 4.2,
  education_level: { /* detailed breakdown */ },
  housing: { /* tenure breakdown */ },
  transport: { /* mode breakdown */ },
  geom: { /* GeoJSON polygon */ }
}
```

### Mock Boundary Data
```javascript
{
  id: 'boundary-1',
  name: 'Stoneclough Parish',
  type: 'parish',
  population: 4770,
  area_hectares: 285.7,
  geom: { /* GeoJSON polygon */ }
}
```

## Performance Benchmarks

### Target Metrics
- **Data Loading**: < 2 seconds for typical datasets
- **Map Rendering**: < 1 second for overlay initialization
- **User Interactions**: < 100ms response time
- **Memory Usage**: < 50MB for complete dataset
- **Bundle Size**: < 500KB for GeoJSON components

### Monitoring
- Test execution time tracking
- Memory usage profiling
- Network request optimization
- Rendering performance metrics

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: GeoJSON System Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:geojson:coverage
      - uses: codecov/codecov-action@v3
```

### Quality Gates
- **Unit Test Coverage**: > 90%
- **Integration Test Coverage**: > 80%
- **E2E Test Success**: 100%
- **Performance Benchmarks**: Within targets
- **No Critical Security Issues**: Required

## Troubleshooting

### Common Issues

**Tests failing with "Cannot read property of undefined"**
- Check mock data structure matches expected interface
- Verify all required properties are included in test data
- Ensure proper async/await handling in tests

**Map-related tests failing**
- Verify Mapbox GL JS mocks are properly configured
- Check that map instance is available before testing
- Ensure proper cleanup in test teardown

**E2E tests timing out**
- Increase timeout values for slow operations
- Add proper wait conditions for async operations
- Check network mocking for API calls

**Coverage reports missing files**
- Verify file paths in Jest configuration
- Check that files are properly imported in tests
- Ensure coverage collection patterns are correct

### Debug Commands
```bash
# Run tests with debug output
DEBUG=* npm run test:geojson

# Run specific test with verbose logging
npx jest --verbose --no-cache lib/services/__tests__/geojson-service.test.ts

# Generate detailed coverage report
npm run test:geojson:coverage -- --verbose

# Run E2E tests with browser visible
npx playwright test --headed __tests__/e2e/geojson-system.e2e.test.ts
```

## Contributing

### Adding New Tests
1. Follow existing test structure and naming conventions
2. Include both positive and negative test cases
3. Add integration tests for new service methods
4. Update E2E tests for new user-facing features
5. Maintain test coverage above quality gates

### Test Review Checklist
- [ ] Tests cover all public methods and components
- [ ] Error cases are properly tested
- [ ] Mock data is realistic and comprehensive
- [ ] Tests are independent and can run in any order
- [ ] Performance implications are considered
- [ ] Documentation is updated for new test scenarios
