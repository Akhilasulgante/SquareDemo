import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Package, DollarSign, Calendar, ChevronRight, RefreshCw, Settings } from 'lucide-react';

// Square API Integration Module
const SquareAPI = {
  accessToken: null,
  baseUrl: 'https://connect.squareup.com/v2',
  
  setAccessToken(token) {
    this.accessToken = token;
  },
  
  async fetchInventory() {
    if (!this.accessToken) {
      return this.getMockInventoryData();
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/catalog/list`, {
        headers: {
          'Square-Version': '2024-01-18',
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return this.processInventoryData(data);
    } catch (error) {
      console.error('Square API Error:', error);
      return this.getMockInventoryData();
    }
  },
  
  async fetchSalesHistory(days = 30) {
    if (!this.accessToken) {
      return this.getMockSalesData(days);
    }
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const response = await fetch(`${this.baseUrl}/orders/search`, {
        method: 'POST',
        headers: {
          'Square-Version': '2024-01-18',
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location_ids: [],
          query: {
            filter: {
              date_time_filter: {
                created_at: {
                  start_at: startDate.toISOString(),
                  end_at: endDate.toISOString()
                }
              }
            }
          }
        })
      });
      
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      return this.processSalesData(data);
    } catch (error) {
      console.error('Square API Error:', error);
      return this.getMockSalesData(days);
    }
  },
  
  getMockInventoryData() {
    return [
      {
        id: '1',
        name: 'Organic Coffee Beans - Dark Roast',
        sku: 'COFFEE-001',
        currentStock: 45,
        category: 'Beverages',
        costPerUnit: 12.50,
        pricePerUnit: 24.99,
        reorderPoint: 50,
        maxStock: 200
      },
      {
        id: '2',
        name: 'Almond Milk Latte Mix',
        sku: 'LATTE-002',
        currentStock: 8,
        category: 'Beverages',
        costPerUnit: 8.00,
        pricePerUnit: 16.99,
        reorderPoint: 25,
        maxStock: 100
      },
      {
        id: '3',
        name: 'Chocolate Croissant',
        sku: 'PASTRY-003',
        currentStock: 120,
        category: 'Bakery',
        costPerUnit: 2.50,
        pricePerUnit: 5.99,
        reorderPoint: 30,
        maxStock: 80
      },
      {
        id: '4',
        name: 'Sourdough Bread Loaf',
        sku: 'BREAD-004',
        currentStock: 15,
        category: 'Bakery',
        costPerUnit: 3.00,
        pricePerUnit: 7.99,
        reorderPoint: 20,
        maxStock: 60
      },
      {
        id: '5',
        name: 'House Blend Tea (50 bags)',
        sku: 'TEA-005',
        currentStock: 180,
        category: 'Beverages',
        costPerUnit: 15.00,
        pricePerUnit: 29.99,
        reorderPoint: 40,
        maxStock: 150
      },
      {
        id: '6',
        name: 'Blueberry Muffin',
        sku: 'MUFFIN-006',
        currentStock: 3,
        category: 'Bakery',
        costPerUnit: 1.75,
        pricePerUnit: 4.49,
        reorderPoint: 15,
        maxStock: 48
      }
    ];
  },
  
  getMockSalesData(days) {
    const items = this.getMockInventoryData();
    const sales = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      items.forEach(item => {
        const baseDaily = item.reorderPoint / 7;
        const variance = (Math.random() - 0.5) * baseDaily * 0.4;
        const quantity = Math.max(1, Math.round(baseDaily + variance));
        
        sales.push({
          itemId: item.id,
          itemName: item.name,
          quantity: quantity,
          date: date.toISOString().split('T')[0],
          revenue: quantity * item.pricePerUnit
        });
      });
    }
    
    return sales;
  }
};

// Risk Analysis Engine
const RiskAnalyzer = {
  calculateDailyVelocity(salesData, itemId) {
    const itemSales = salesData.filter(s => s.itemId === itemId);
    if (itemSales.length === 0) return 0;
    
    const totalQuantity = itemSales.reduce((sum, s) => sum + s.quantity, 0);
    const uniqueDays = new Set(itemSales.map(s => s.date)).size;
    
    return uniqueDays > 0 ? totalQuantity / uniqueDays : 0;
  },
  
  calculateStockoutRisk(item, dailyVelocity) {
    if (dailyVelocity === 0) return { risk: 'low', daysUntilStockout: 999, severity: 0 };
    
    const daysUntilStockout = item.currentStock / dailyVelocity;
    
    let risk = 'low';
    let severity = 0;
    
    if (daysUntilStockout <= 2) {
      risk = 'critical';
      severity = 100;
    } else if (daysUntilStockout <= 5) {
      risk = 'high';
      severity = 75;
    } else if (daysUntilStockout <= 10) {
      risk = 'medium';
      severity = 50;
    } else {
      severity = 25;
    }
    
    return { risk, daysUntilStockout, severity };
  },
  
  calculateOverstockRisk(item, dailyVelocity) {
    if (dailyVelocity === 0) {
      return { risk: 'high', daysOfStock: 999, severity: 80, tiedUpCapital: item.currentStock * item.costPerUnit };
    }
    
    const daysOfStock = item.currentStock / dailyVelocity;
    const tiedUpCapital = item.currentStock * item.costPerUnit;
    
    let risk = 'low';
    let severity = 0;
    
    if (daysOfStock > 60) {
      risk = 'high';
      severity = 85;
    } else if (daysOfStock > 30) {
      risk = 'medium';
      severity = 60;
    } else if (item.currentStock > item.maxStock) {
      risk = 'high';
      severity = 75;
    } else {
      severity = 20;
    }
    
    return { risk, daysOfStock, severity, tiedUpCapital };
  },
  
  generateRecommendation(item, stockoutRisk, overstockRisk, dailyVelocity) {
    const recommendations = [];
    
    if (stockoutRisk.risk === 'critical' || stockoutRisk.risk === 'high') {
      const reorderQuantity = Math.ceil(dailyVelocity * 14);
      recommendations.push({
        type: 'reorder',
        priority: 'urgent',
        action: `Reorder ${reorderQuantity} units immediately`,
        reason: `Only ${Math.floor(stockoutRisk.daysUntilStockout)} days of stock remaining`,
        impact: `Prevent ${Math.round(dailyVelocity * item.pricePerUnit * stockoutRisk.daysUntilStockout)} in lost revenue`
      });
    } else if (stockoutRisk.risk === 'medium') {
      const reorderQuantity = Math.ceil(dailyVelocity * 14);
      recommendations.push({
        type: 'reorder',
        priority: 'normal',
        action: `Plan to reorder ${reorderQuantity} units within 5 days`,
        reason: `Stock levels approaching reorder point`,
        impact: `Maintain healthy inventory levels`
      });
    }
    
    if (overstockRisk.risk === 'high') {
      if (overstockRisk.daysOfStock > 60) {
        recommendations.push({
          type: 'reduce',
          priority: 'high',
          action: `Run promotion or reduce reorder quantity by 50%`,
          reason: `Over 60 days of inventory on hand`,
          impact: `Free up $${overstockRisk.tiedUpCapital.toFixed(2)} in tied capital`
        });
      } else {
        recommendations.push({
          type: 'reduce',
          priority: 'medium',
          action: `Pause reordering until stock drops to ${item.reorderPoint} units`,
          reason: `Exceeding maximum recommended stock levels`,
          impact: `Reduce storage costs and capital tie-up`
        });
      }
    } else if (overstockRisk.risk === 'medium') {
      recommendations.push({
        type: 'monitor',
        priority: 'low',
        action: `Monitor stock levels and adjust reorder timing`,
        reason: `Inventory levels higher than optimal`,
        impact: `Optimize cash flow`
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'healthy',
        priority: 'info',
        action: `No action needed - stock levels are healthy`,
        reason: `Current inventory is well-balanced`,
        impact: `Continue current ordering patterns`
      });
    }
    
    return recommendations;
  },
  
  analyzeInventory(inventory, salesData) {
    return inventory.map(item => {
      const dailyVelocity = this.calculateDailyVelocity(salesData, item.id);
      const stockoutRisk = this.calculateStockoutRisk(item, dailyVelocity);
      const overstockRisk = this.calculateOverstockRisk(item, dailyVelocity);
      const recommendations = this.generateRecommendation(item, stockoutRisk, overstockRisk, dailyVelocity);
      
      const overallRisk = Math.max(stockoutRisk.severity, overstockRisk.severity);
      
      return {
        ...item,
        dailyVelocity,
        stockoutRisk,
        overstockRisk,
        recommendations,
        overallRisk
      };
    });
  }
};

// Main Application Component
export default function SquareSellerCopilot() {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [apiToken, setApiToken] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    
    const inventoryData = await SquareAPI.fetchInventory();
    const salesData = await SquareAPI.fetchSalesHistory(30);
    const analyzed = RiskAnalyzer.analyzeInventory(inventoryData, salesData);
    
    analyzed.sort((a, b) => b.overallRisk - a.overallRisk);
    
    setInventory(analyzed);
    setIsLoading(false);
  };
  
  const handleApiTokenSave = () => {
    SquareAPI.setAccessToken(apiToken);
    setShowSettings(false);
    loadData();
  };
  
  const getRiskColor = (severity) => {
    if (severity >= 75) return 'text-red-600 bg-red-50 border-red-200';
    if (severity >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (severity >= 25) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };
  
  const getRiskBadgeColor = (risk) => {
    if (risk === 'critical') return 'bg-red-600 text-white';
    if (risk === 'high') return 'bg-orange-600 text-white';
    if (risk === 'medium') return 'bg-yellow-500 text-white';
    return 'bg-green-600 text-white';
  };
  
  const getPriorityColor = (priority) => {
    if (priority === 'urgent') return 'bg-red-100 text-red-800 border-red-300';
    if (priority === 'high') return 'bg-orange-100 text-orange-800 border-orange-300';
    if (priority === 'normal' || priority === 'medium') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };
  
  const filteredInventory = inventory.filter(item => {
    if (filterRisk === 'all') return true;
    if (filterRisk === 'stockout') return item.stockoutRisk.risk === 'critical' || item.stockoutRisk.risk === 'high';
    if (filterRisk === 'overstock') return item.overstockRisk.risk === 'high';
    return true;
  });
  
  const criticalAlerts = inventory.filter(item => 
    item.stockoutRisk.risk === 'critical' || 
    (item.overstockRisk.risk === 'high' && item.overstockRisk.daysOfStock > 60)
  ).length;
  
  const totalCapitalTied = inventory.reduce((sum, item) => 
    sum + (item.currentStock * item.costPerUnit), 0
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Square Seller Copilot</h1>
                <p className="text-sm text-slate-600">Inventory Risk Predictor</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Square API Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Access Token (Optional - Using Demo Data)
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter your Square API access token"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-sm text-slate-500">
                  Get your token from the <a href="https://developer.squareup.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Square Developer Dashboard</a>
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApiTokenSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save & Refresh Data
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard Overview */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Critical Alerts</span>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{criticalAlerts}</div>
            <p className="text-sm text-slate-500 mt-1">Require immediate action</p>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Total Items</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{inventory.length}</div>
            <p className="text-sm text-slate-500 mt-1">Being monitored</p>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Capital Tied Up</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">${totalCapitalTied.toFixed(0)}</div>
            <p className="text-sm text-slate-500 mt-1">In current inventory</p>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Analysis Period</span>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">30</div>
            <p className="text-sm text-slate-500 mt-1">Days of sales data</p>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Filter by:</span>
            <button
              onClick={() => setFilterRisk('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRisk === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterRisk('stockout')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRisk === 'stockout' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4 inline mr-1" />
              Stockout Risks
            </button>
            <button
              onClick={() => setFilterRisk('overstock')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRisk === 'overstock' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Overstock Risks
            </button>
          </div>
        </div>
        
        {/* Inventory List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Analyzing inventory...</p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No items match the selected filter</p>
            </div>
          ) : (
            filteredInventory.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg border-2 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                  selectedItem?.id === item.id ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                }`}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                        <span className="text-sm text-slate-500">SKU: {item.sku}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Current Stock</p>
                          <p className="text-lg font-bold text-slate-900">{item.currentStock} units</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Daily Velocity</p>
                          <p className="text-lg font-bold text-slate-900">{item.dailyVelocity.toFixed(1)} units/day</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Stockout Risk</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(item.stockoutRisk.risk)}`}>
                            {item.stockoutRisk.risk.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Overstock Risk</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(item.overstockRisk.risk)}`}>
                            {item.overstockRisk.risk.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              item.overallRisk >= 75 ? 'bg-red-500' :
                              item.overallRisk >= 50 ? 'bg-orange-500' :
                              item.overallRisk >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(item.overallRisk, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-600">{item.overallRisk}%</span>
                      </div>
                    </div>
                    
                    <ChevronRight className={`w-6 h-6 text-slate-400 transition-transform ml-4 ${selectedItem?.id === item.id ? 'rotate-90' : ''}`} />
                  </div>
                  
                  {/* Expanded Details */}
                  {selectedItem?.id === item.id && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Stockout Analysis */}
                        <div className={`rounded-lg border-2 p-4 ${getRiskColor(item.stockoutRisk.severity)}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="w-5 h-5" />
                            <h4 className="font-semibold">Stockout Analysis</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Days until stockout:</span>
                              <span className="font-semibold">{Math.floor(item.stockoutRisk.daysUntilStockout)} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Risk level:</span>
                              <span className="font-semibold">{item.stockoutRisk.risk.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reorder point:</span>
                              <span className="font-semibold">{item.reorderPoint} units</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Overstock Analysis */}
                        <div className={`rounded-lg border-2 p-4 ${getRiskColor(item.overstockRisk.severity)}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-5 h-5" />
                            <h4 className="font-semibold">Overstock Analysis</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Days of stock:</span>
                              <span className="font-semibold">{Math.floor(item.overstockRisk.daysOfStock)} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Risk level:</span>
                              <span className="font-semibold">{item.overstockRisk.risk.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tied up capital:</span>
                              <span className="font-semibold">${item.overstockRisk.tiedUpCapital.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recommendations */}
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-blue-600" />
                          Recommendations
                        </h4>
                        <div className="space-y-3">
                          {item.recommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className={`rounded-lg border-2 p-4 ${getPriorityColor(rec.priority)}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="px-2 py-1 rounded text-xs font-bold uppercase bg-white bg-opacity-50">
                                  {rec.priority}
                                </span>
                                <div className="flex-1">
                                  <p className="font-semibold mb-1">{rec.action}</p>
                                  <p className="text-sm mb-2">{rec.reason}</p>
                                  <p className="text-xs font-medium">💡 Impact: {rec.impact}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
        <p>Square Seller Copilot • Inventory Risk Predictor • Powered by Square API</p>
        <p className="mt-1">Currently using {apiToken ? 'Live' : 'Demo'} data</p>
      </div>
    </div>
  );
}
