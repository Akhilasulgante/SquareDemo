# Square Seller Copilot - Inventory Risk Predictor

A React-based dashboard that helps Square sellers predict and prevent inventory stockouts and overstock situations using AI-powered risk analysis.

## Features

✅ **Real-time Inventory Analysis**
- Stockout risk detection with days-until-stockout predictions
- Overstock identification with capital tie-up calculations
- Daily sales velocity tracking

✅ **Smart Recommendations**
- Priority-based action items (urgent, high, normal, low)
- Reorder quantity suggestions
- Cost-saving opportunities

✅ **Visual Dashboard**
- Risk severity indicators with color coding
- Filtering by risk type (stockout/overstock)
- Expandable item details with comprehensive analysis

✅ **Square API Integration**
- Connects to your Square account for live data
- Fetches inventory levels and sales history
- Falls back to demo data for testing

## Quick Start

### 1. Clone/Download the Files

Save `square-copilot.jsx` to your project directory.

### 2. Install Dependencies

```bash
npm install react lucide-react
# or
yarn add react lucide-react
```

### 3. Run with Demo Data (No API Key Required)

You can immediately test the application with realistic demo data:

```javascript
import SquareSellerCopilot from './square-copilot';

function App() {
  return <SquareSellerCopilot />;
}

export default App;
```

### 4. Connect to Square API (Optional)

To use your real Square data:

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application or select existing one
3. Generate an access token (Sandbox for testing, Production for live data)
4. In the app, click the Settings icon (⚙️)
5. Paste your access token and click "Save & Refresh Data"

## Square API Setup (Detailed)

### Step 1: Create a Square Developer Account

1. Visit https://developer.squareup.com/
2. Sign in with your Square account
3. Click "Create Your First Application"

### Step 2: Configure Your Application

1. Name your application (e.g., "Inventory Copilot")
2. Select the appropriate environment:
   - **Sandbox**: For testing with fake data
   - **Production**: For real business data

### Step 3: Set Permissions

Your app needs the following OAuth permissions:
- `ITEMS_READ` - Read catalog items and inventory
- `ORDERS_READ` - Read sales order history

### Step 4: Generate Access Token

1. Go to the "Credentials" tab
2. Copy your **Access Token**
3. Keep this token secure - treat it like a password

### Step 5: Test Your Integration

```javascript
// Test the API connection
const SquareAPI = {
  accessToken: 'YOUR_TOKEN_HERE',
  baseUrl: 'https://connect.squareup.com/v2',
  
  async testConnection() {
    const response = await fetch(`${this.baseUrl}/catalog/list`, {
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  }
};
```

## How the Risk Analysis Works

### Stockout Risk Detection

The system calculates:

1. **Daily Velocity**: Average units sold per day over the past 30 days
2. **Days Until Stockout**: Current stock ÷ Daily velocity
3. **Risk Level**:
   - **Critical** (≤2 days): Immediate reorder needed
   - **High** (≤5 days): Reorder within 24-48 hours
   - **Medium** (≤10 days): Plan reorder within a week
   - **Low** (>10 days): Healthy stock levels

### Overstock Risk Detection

The system identifies:

1. **Days of Stock**: How many days current inventory will last
2. **Capital Tied Up**: Total cost of inventory on hand
3. **Risk Level**:
   - **High**: >60 days of stock OR exceeds max stock level
   - **Medium**: 30-60 days of stock
   - **Low**: <30 days of stock

### Recommendation Engine

Based on the analysis, the system generates:

- **Reorder recommendations**: Quantity and timing
- **Promotion suggestions**: For overstock items
- **Capital optimization**: Freeing up tied funds
- **Risk prevention**: Avoiding stockouts

## Customization

### Adjusting Risk Thresholds

Edit the `RiskAnalyzer.calculateStockoutRisk()` method:

```javascript
calculateStockoutRisk(item, dailyVelocity) {
  const daysUntilStockout = item.currentStock / dailyVelocity;
  
  // Customize these thresholds
  if (daysUntilStockout <= 2) {  // Change from 2 to your preference
    risk = 'critical';
  } else if (daysUntilStockout <= 5) {  // Change from 5
    risk = 'high';
  }
  // ... rest of logic
}
```

### Changing Analysis Period

Modify the sales history fetch:

```javascript
// In loadData() function
const salesData = await SquareAPI.fetchSalesHistory(60); // Change from 30 to 60 days
```

### Adding Custom Categories

Filter by product category:

```javascript
const filteredInventory = inventory.filter(item => {
  if (selectedCategory !== 'all') {
    return item.category === selectedCategory;
  }
  return true;
});
```

## Integration with Existing Square Apps

### As a React Component

```javascript
import SquareSellerCopilot from './square-copilot';

function Dashboard() {
  return (
    <div>
      <YourExistingHeader />
      <SquareSellerCopilot />
      <YourExistingFooter />
    </div>
  );
}
```

### Embedding in Existing UI

```javascript
// Extract just the data analysis
import { SquareAPI, RiskAnalyzer } from './square-copilot';

async function getInventoryRisks() {
  const inventory = await SquareAPI.fetchInventory();
  const sales = await SquareAPI.fetchSalesHistory(30);
  return RiskAnalyzer.analyzeInventory(inventory, sales);
}
```

## API Rate Limits

Square API has rate limits:
- **Sandbox**: 100 requests per minute
- **Production**: 500 requests per minute per seller

The app minimizes API calls by:
- Caching inventory data
- Only refreshing on user request
- Batching similar requests

## Security Best Practices

1. **Never commit tokens to Git**
   ```bash
   echo "*.env" >> .gitignore
   ```

2. **Use environment variables**
   ```javascript
   const token = process.env.REACT_APP_SQUARE_TOKEN;
   ```

3. **Implement token refresh**
   - Use OAuth for long-term access
   - Refresh tokens before expiration

4. **Server-side API calls** (Recommended for production)
   ```javascript
   // Instead of calling Square API from browser:
   const response = await fetch('/api/inventory'); // Your backend
   ```

## Troubleshooting

### "API request failed" Error

**Cause**: Invalid token or expired credentials

**Solution**:
1. Verify token is correct
2. Check token permissions include `ITEMS_READ` and `ORDERS_READ`
3. Ensure you're using the right environment (sandbox vs production)

### No inventory showing

**Cause**: Empty catalog or no sales data

**Solution**:
1. Add test items in Square Dashboard
2. Create test orders
3. Use demo data first to verify app works

### CORS errors

**Cause**: Browser blocking direct API calls

**Solution**:
1. Implement a backend proxy
2. Use Square's OAuth flow
3. Deploy with proper CORS headers

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Netlify

```bash
npm run build
netlify deploy --prod
```

### Custom Server

```bash
npm run build
# Upload build/ directory to your server
```

## Future Enhancements

- [ ] Email/SMS alerts for critical stockouts
- [ ] Integration with suppliers for auto-reordering
- [ ] Seasonal trend analysis
- [ ] Multi-location inventory support
- [ ] Cash flow forecasting
- [ ] Export reports to PDF/Excel

## Support

For Square API issues:
- Documentation: https://developer.squareup.com/docs
- Community: https://developer.squareup.com/forums

For app issues:
- Check console for error messages
- Verify API token permissions
- Test with demo data first

## License

MIT License - Feel free to use and modify for your business needs.

---

**Built for Square sellers who want to optimize inventory and prevent lost sales.**
