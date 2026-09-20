const item = (id, hoursAgo, headline, summary, symbols, sector) => ({
  id: `sample-${id}`,
  hoursAgo,
  headline,
  summary,
  symbols,
  sector,
  source: 'Sample',
})

const ITEMS = [
  item(1, 1, 'Refining margins stay firm as energy demand holds up', 'Analysts note steady throughput across large refiners, with margins holding near recent averages.', ['RELIANCE', 'ONGC'], 'Energy'),
  item(2, 3, 'Power generators report higher plant availability', 'Thermal capacity utilisation improved on the back of stronger seasonal demand.', ['NTPC'], 'Energy'),
  item(3, 5, 'Upstream producers watch crude realisations closely', 'Companies flagged that realisations remain the main swing factor for quarterly earnings.', ['ONGC'], 'Energy'),
  item(4, 2, 'IT services firms see steady deal pipeline', 'Large-deal wins continued, though clients remain cautious on discretionary spending.', ['TCS', 'INFY', 'HCLTECH', 'WIPRO'], 'IT'),
  item(5, 6, 'Hiring outlook cautious across software exporters', 'Campus onboarding plans were kept flexible as demand visibility stays mixed.', ['TCS', 'WIPRO'], 'IT'),
  item(6, 9, 'Digital transformation projects drive mid-tier growth', 'Cloud and data engineering work continued to lead incremental revenue.', ['INFY', 'HCLTECH'], 'IT'),
  item(7, 1, 'Private banks report stable credit growth', 'Loan books expanded at a steady pace while asset quality indicators stayed benign.', ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK'], 'Banking'),
  item(8, 4, 'Public-sector lender highlights improving recoveries', 'Management pointed to lower slippages and stronger collections over recent quarters.', ['SBIN'], 'Banking'),
  item(9, 8, 'Deposit competition keeps margin outlook in focus', 'Banks said funding costs remain the key variable for net interest margins.', ['HDFCBANK', 'KOTAKBANK', 'AXISBANK'], 'Banking'),
  item(10, 2, 'Rural demand supports staples volumes', 'Consumer goods makers reported a gradual pick-up in volume growth outside metros.', ['HINDUNILVR', 'NESTLEIND', 'ITC'], 'FMCG'),
  item(11, 7, 'Packaged foods makers pass on input cost changes', 'Selective price increases were introduced to protect gross margins.', ['NESTLEIND', 'ITC'], 'FMCG'),
  item(12, 3, 'Passenger vehicle sales hold steady into festive season', 'Dealers expect inventory levels to remain comfortable heading into the festive quarter.', ['MARUTI', 'TATAMOTORS', 'M&M'], 'Auto'),
  item(13, 10, 'Utility vehicle demand outpaces small cars', 'Product mix continued to shift toward larger vehicles, lifting average realisations.', ['M&M', 'MARUTI'], 'Auto'),
  item(14, 5, 'Generic drug makers eye new product launches', 'Pipelines in specialty and complex generics were highlighted at investor meetings.', ['SUNPHARMA', 'DRREDDY'], 'Pharma'),
  item(15, 12, 'Regulatory inspections remain a watch item for pharma', 'Analysts noted that plant compliance outcomes can move near-term sentiment.', ['DRREDDY', 'SUNPHARMA'], 'Pharma'),
  item(16, 4, 'Order books swell at large engineering firms', 'Infrastructure and energy projects contributed to a healthy order backlog.', ['LT'], 'Infrastructure'),
  item(17, 6, 'Telecom operators focus on average revenue per user', 'Tariff and premium-plan mix remain the main levers for revenue growth.', ['BHARTIARTL'], 'Telecom'),
  item(18, 11, 'Jewellery demand steady despite price volatility', 'Retailers reported resilient footfalls with a growing share of studded jewellery.', ['TITAN'], 'Consumer'),
  item(19, 9, 'Decorative paints see moderate volume growth', 'Raw-material costs eased slightly, helping margins for paint makers.', ['ASIANPAINT'], 'Consumer'),
  item(20, 7, 'Steelmakers monitor global pricing and imports', 'Domestic producers said spreads depend on input costs and import pressure.', ['TATASTEEL', 'JSWSTEEL'], 'Metals'),
  item(21, 14, 'Capacity expansions continue across metal producers', 'Companies reiterated capex plans aimed at lifting domestic capacity over the next few years.', ['JSWSTEEL', 'TATASTEEL'], 'Metals'),
  item(22, 8, 'Diversified group progresses on infrastructure projects', 'Airport and logistics assets remained the focus of recent management commentary.', ['ADANIENT'], 'Conglomerate'),
  item(23, 13, 'Markets: how to read a day range', 'A short primer on why intraday highs and lows matter when judging a price move.', [], null),
  item(24, 20, 'Learning corner: average price vs. last price', 'Your average buy price only changes when you buy more shares, not when you sell.', [], null),
  item(25, 26, 'Learning corner: diversification across sectors', 'Holding stocks from different sectors can reduce the impact of a single sector falling.', [], null),
]

export function getSampleNews({ symbol, sector, limit = 50, now = Date.now() } = {}) {
  return ITEMS.filter((n) => {
    if (symbol) return n.symbols.includes(symbol)
    if (sector) return n.sector === sector
    return true
  })
    .slice(0, limit)
    .map(({ hoursAgo, ...n }) => ({ ...n, publishedAt: now - hoursAgo * 3_600_000 }))
    .sort((a, b) => b.publishedAt - a.publishedAt)
}
