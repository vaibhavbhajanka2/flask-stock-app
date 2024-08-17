# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START gae_python38_app]
# [START gae_python3_app]
from flask import Flask, jsonify
import json
import requests
from datetime import datetime
from dateutil.relativedelta import *

# from finnhub.exceptions import FinnhubAPIException
# from finnhub.exceptions import FinnhubRequestException


class Client:
    API_URL = "https://api.finnhub.io/api/v1"
    DEFAULT_TIMEOUT = 10

    def __init__(self, api_key, proxies=None):
        self._session = self._init_session(api_key, proxies)

    @staticmethod
    def _init_session(api_key, proxies):
        session = requests.session()
        session.headers.update({"Accept": "application/json",
                                "User-Agent": "finnhub/python"})
        session.params["token"] = api_key
        if proxies is not None:
            session.proxies.update(proxies)

        return session

    def close(self):
        self._session.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    def _request(self, method, path, **kwargs):
        uri = "{}/{}".format(self.API_URL, path)
        kwargs["timeout"] = kwargs.get("timeout", self.DEFAULT_TIMEOUT)
        kwargs["params"] = self._format_params(kwargs.get("params", {}))

        response = getattr(self._session, method)(uri, **kwargs)
        return self._handle_response(response)

    @staticmethod
    def _handle_response(response):
        if not response.ok:
            raise FinnhubAPIException(response)

        try:
            content_type = response.headers.get('Content-Type', '')
            if 'application/json' in content_type:
                return response.json()
            if 'text/csv' in content_type:
                return response.text
            if 'text/plain' in content_type:
                return response.text
            raise FinnhubRequestException("Invalid Response: {}".format(response.text))
        except ValueError:
            raise FinnhubRequestException("Invalid Response: {}".format(response.text))

    @staticmethod
    def _merge_two_dicts(first, second):
        result = first.copy()
        result.update(second)
        return result

    @staticmethod
    def _format_params(params):
        return {k: json.dumps(v) if isinstance(v, bool) else v for k, v in params.items()}

    def _get(self, path, **kwargs):
        return self._request("get", path, **kwargs)

    @property
    def api_key(self):
        return self._session.params.get("token")

    @api_key.setter
    def api_key(self, token):
        self._session.params["token"] = token

    def company_profile2(self, **params):
        return self._get("/stock/profile2", params=params)
    
    def quote(self, symbol):
        return self._get("/quote", params={
            "symbol": symbol
        })
    
    def recommendation_trends(self, symbol):
        return self._get("/stock/recommendation", params={"symbol": symbol})
    
    def company_news(self, symbol, _from, to):
        return self._get("/company-news", params={
            "symbol": symbol,
            "from": _from,
            "to": to
        })

# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = Flask(__name__, static_url_path='/static')


@app.route("/")
def homepage():
    return app.send_static_file("index.html")

finnhub_api_key = 'cn7c821r01qgjtj4gbagcn7c821r01qgjtj4gbb0'

polygon_api_key = 'tiDR4mjMhiDolRT2alIEhHd5pyONtkoP'

def call_api(base, ticker):
    try:
            url = f"{base}?symbol={ticker}&token={api_key}"
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            return data
    except requests.HTTPError as http_err:
        error_message = f"HTTP Error occurred: {str(http_err)}"
        return jsonify({'error': error_message}), response.status_code
    except requests.RequestException as e:
        error_message = f"Request failed: {str(e)}"
        return jsonify({'error': error_message}), 500
    
finnhub_client = Client(finnhub_api_key)

@app.route('/getCompany/<ticker_symbol>', methods=['GET'])
def get_company_data(ticker_symbol):
    # json_data = call_api("https://finnhub.io/api/v1/stock/profile2", ticker_symbol)
    # return json_data
    company_profile = finnhub_client.company_profile2(symbol=ticker_symbol)
    return company_profile
    
@app.route('/getStockSummary/<ticker_symbol>', methods=['GET'])
def get_stock_summary(ticker_symbol):
    # json_data = call_api("https://finnhub.io/api/v1/quote", ticker_symbol)
    # return json_data
    quote = finnhub_client.quote(symbol=ticker_symbol)
    return quote
    
@app.route('/getHistoricalData/<ticker_symbol>')
def get_historical_data(ticker_symbol):
    to_date = datetime.now()
    from_date = to_date - relativedelta(months=6, days=1)
    from_date_str = from_date.strftime('%Y-%m-%d')
    to_date_str = to_date.strftime('%Y-%m-%d')
    
    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker_symbol}/range/1/day/{from_date_str}/{to_date_str}?adjusted=true&sort=asc&apiKey={polygon_api_key}"
    
    response = requests.get(url)
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch data'}), response.status_code

@app.route('/getRecommendation/<ticker_symbol>', methods=['GET'])
def get_recommendation(ticker_symbol):
    # json_data = call_api("https://finnhub.io/api/v1/stock/recommendation", ticker_symbol)
    # return json_data
    recommendation = finnhub_client.recommendation_trends(symbol=ticker_symbol)
    return recommendation

@app.route('/getCompanyNews/<ticker_symbol>', methods=['GET'])
def get_news(ticker_symbol):
    # json_data = call_api("https://finnhub.io/api/v1/stock/recommendation", ticker_symbol)
    # return json_data
    today = datetime.now().strftime('%Y-%m-%d')
    before_30 = (datetime.now() - relativedelta(days=30)).strftime('%Y-%m-%d')
    news = finnhub_client.company_news(symbol=ticker_symbol, _from = before_30, to=today)
    return news

if __name__ == "__main__":
    app.run(debug=True)
# [END gae_python3_app]
# [END gae_python38_app]
