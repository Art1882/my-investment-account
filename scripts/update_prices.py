import json, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

SYMBOLS = {'gold': 'GLDM', 'usa': 'SPY', 'asia': 'AIA'}
URL = 'https://query2.finance.yahoo.com/v8/finance/chart/{}?range=5d&interval=1d'

def quote(symbol):
    url = URL.format(urllib.parse.quote(symbol))
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=25) as response:
        result = json.load(response)['chart']['result'][0]
    values = [float(value) for value in result['indicators']['quote'][0]['close'] if value is not None]
    if len(values) < 2:
        raise RuntimeError(f'No usable prices for {symbol}')
    return values[-1], values[-2]

path = Path('dist/prices.json')
old = json.loads(path.read_text())
assets = {}
for key, symbol in SYMBOLS.items():
    current, previous = quote(symbol)
    assets[key] = {**old['assets'][key], 'usd': current, 'previousUsd': previous}
fx, _ = quote('USDMYR=X')
data = {'asOf': datetime.now(timezone.utc).isoformat(), 'fxUsdMyr': fx, 'assets': assets, 'source': 'Delayed Yahoo Finance market data'}
path.write_text(json.dumps(data, indent=2) + '\n')
