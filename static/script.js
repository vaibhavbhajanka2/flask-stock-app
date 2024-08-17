document.getElementById("searchForm").addEventListener("submit", onSubmit);
document.getElementById("searchForm").addEventListener("reset", onReset);
document.getElementById("stock-summary").addEventListener("click", enableStockSummary);
document.getElementById("charts").addEventListener("click", enableCharts);
document.getElementById("news").addEventListener("click", enableNews);

function onReset(){
    document.getElementById("nav").style.display = "none";
    document.getElementById("company-card").style.display = "none";
    document.getElementById("stock-summary").style.display = "none";
    document.getElementById("news-container").style.display = "none";
    document.getElementById("charts-container").style.display = "none";
    document.getElementById("error-container").style.display = "none";
}

function enableCompanyProfile() {
    document.getElementById("company-btn").focus();
    document.getElementById("company-card").style.display = "block";
    document.getElementById("stock-summary").style.display = "none";
    document.getElementById("news-container").style.display = "none";
    document.getElementById("charts-container").style.display = "none";
}

function displayCompanyProfile(data) {
    document.getElementById("logo").src = data["logo"];
    document.getElementById("name").textContent = data["name"];
    document.getElementById("ticker1").textContent = data["ticker"];
    document.getElementById("exchange").textContent = data["exchange"];
    document.getElementById("ipo").textContent = data["ipo"];
    document.getElementById("finnhubIndustry").textContent = data["finnhubIndustry"];
}

function enableStockSummary() {
    document.getElementById("stock-btn").focus();
    document.getElementById("company-card").style.display = "none";
    document.getElementById("stock-summary").style.display = "block";
    document.getElementById("news-container").style.display = "none";
    document.getElementById("charts-container").style.display = "none";
}

function epochToDate(epoch) {
    var date = new Date(epoch * 1000);
    var day = date.getDate();
    var month = date.toLocaleString('default', { month: 'long' });
    var year = date.getFullYear();
    return day + ' ' + month + ', ' + year;
}

function displayStockSummary(data, ticker) {
    document.getElementById("ticker2").textContent = ticker;
    document.getElementById("t").textContent = epochToDate(data["t"]);
    document.getElementById("pc").textContent = data["pc"];
    document.getElementById("o").textContent = data["o"];
    document.getElementById("h").textContent = data["h"];
    document.getElementById("l").textContent = data["l"];
    document.getElementById("d").innerHTML = data["d"] +
        (data["d"] >= 0 ? '<img src="static/img/GreenArrowUp.png" alt="Increase">' : '<img src="static/img/RedArrowDown.png" alt="Decrease">');
    document.getElementById("dp").innerHTML = data["dp"] +
        (data["dp"] >= 0 ? '<img src="static/img/GreenArrowUp.png" alt="Increase">' : '<img src="static/img/RedArrowDown.png" alt="Decrease">');
}

function enableNews() {
    document.getElementById("news").focus();
    document.getElementById("company-card").style.display = "none";
    document.getElementById("stock-summary").style.display = "none";
    document.getElementById("news-container").style.display = "block";
    document.getElementById("charts-container").style.display = "none";
}

function enableCharts() {
    document.getElementById("charts").focus();
    document.getElementById("company-card").style.display = "none";
    document.getElementById("stock-summary").style.display = "none";
    document.getElementById("news-container").style.display = "none";
    document.getElementById("charts-container").style.display = "block";
}

async function fetchStockSummary(ticker) {
    try {
        const response = await fetch(`/getStockSummary/${ticker}`);
        if (!response.ok) {
            throw new Error(`HTTP ERROR!\nStatus: ${response.statusText}`);
        }
        const data = await response.json();
        displayStockSummary(data, ticker);
    } catch (error) {
        console.error('Fetch error:', error.message);
        alert(error.message);
    }

}

async function fetchRecommendation(ticker) {
    try {
        const response = await fetch(`/getRecommendation/${ticker}`);
        if (!response.ok) {
            throw new Error(`HTTP ERROR!\nStatus: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data[0])
        displayRecommendation(data[0]);
    } catch (error) {
        console.error('Fetch error:', error.message);
        alert(error.message);
    }
}

function displayRecommendation(data) {
    document.getElementById("strongSell").textContent = data["strongSell"];
    document.getElementById("sell").textContent = data["sell"];
    document.getElementById("hold").textContent = data["hold"];
    document.getElementById("buy").textContent = data["buy"];
    document.getElementById("strongBuy").textContent = data["strongBuy"];
}

async function fetchCompanyNews(ticker) {
    try {

        const response = await fetch(`/getCompanyNews/${ticker}`);
        if (!response.ok) {
            throw new Error(`HTTP ERROR!\nStatus: ${response.statusText}`);
        }
        const data = await response.json();
        const validArticles = data.filter(article => article.image && article.url && article.headline && article.datetime)
        const newsContainer = document.getElementById('news-container');
        newsContainer.innerHTML = validArticles.slice(0, 5).map(article => `
        <div class="news-article">
            <img src="${article.image}" alt="Article Image">
            <div>
                <h3>${article.headline}</h3>
                <p>${epochToDate(article.datetime)}</p>
                <a href="${article.url}" target="_blank">See Original Post</a>
            </div>
        </div>
    `).join('');
    } catch (error) {
        console.error('Fetch error:', error.message);
        alert(error.message);
    }
}

async function fetchHistoricalData(ticker) {
    try {
        const response = await fetch(`/getHistoricalData/${ticker}`);
        if (!response.ok) {
            throw new Error(`HTTP ERROR!\nStatus: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data)
        renderChart(data, ticker);
    } catch (error) {
        console.error('Fetch error:', error.message);
        alert(error.message);
    }
}

function renderChart(data, ticker) {
    const priceData = data.results.map(point => [point.t, point.c]);
    const volumeData = data.results.map(point => [point.t, point.v]);
    
    const maxVolume = Math.max(...volumeData.map(item => item[1]));

    const volumeAxisMax = maxVolume * 2;

    Highcharts.stockChart('charts-container', {
        rangeSelector: {
            buttons: [{
                type: 'day',
                count: 7,
                text: '7d',
                enabled: true,
            }, {
                type: 'day',
                count: 15,
                text: '15d',
                enabled: true,
            }, {
                type: 'month',
                count: 1,
                text: '1m',
                enabled: true,
            }, {
                type: 'month',
                count: 3,
                text: '3m',
                enabled: true,
            }, {
                type: 'month',
                count: 6,
                text: '6m',
                enabled: true,
            }],
            selected:0,
            inputEnabled: false
        },
        title: {
            text: `Stock Price ${ticker} ${new Date().toISOString().split('T')[0]}`
        },
        subtitle: {
            text: 'Source: <a href="https://polygon.io/" target="_blank" style="color:blue; text-decoration: underline;">Polygon.io</a>'
        },
        navigator:{
            series: {
                accessibility:{
                    exposeAsGroupOnly: true,
                }
            }
        },
        plotOptions:{
            column: {
                pointPadding: 0.2,
                borderWidth: 0.8,
            },
            series:{
                pointWidth:6,
                pointPlacement:"on"
            }
        },
        yAxis: [{
            labels:{
                align:'right',
                x:-3,
            },
            title: {
                text: 'Stock Price'
            },
            
            opposite: false,
        }, {
            labels:{
                align:'left',
                x:3,
            },
            title: {
                text: 'Volume'
            },
            max: volumeAxisMax,
            offset:0,
            opposite:true,
        }],
        series: [{
            type: 'area',
            name: 'Stock Price',
            data: priceData,
            threshold: null,
            tooltip: {
                valueDecimals: 2
            },
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            },
        }, {
            type: 'column',
            name: 'Volume',
            data: volumeData,
            yAxis: 1,
            color: '#000000',
        }],
        chart:{
            height:600
        }
    });
}


async function onSubmit(event) {
    event.preventDefault();
    var ticker = document.getElementById("tickerSym").value.toUpperCase();
    try {
        const response = await fetch(`/getCompany/${ticker}`);
        if (!response.ok) {
            throw new Error(`HTTP ERROR!\nStatus: ${response.statusText}`);
        }
        const data = await response.json();
        if (Object.keys(data).length === 0) {
            document.getElementById("nav").style.display = "none";
            document.getElementById("company-card").style.display = "none";
            document.getElementById("stock-summary").style.display = "none";
            document.getElementById("news-container").style.display = "none";
            document.getElementById("error-container").style.display = "flex";
            document.getElementById("error-text").innerHTML = 'Error: No record has been found, please enter a valid symbol';
        }
        else {
            enableCompanyProfile();
            document.getElementById("error-container").style.display = "none";
            document.getElementById("nav").style.display = "flex";
            document.getElementById("company-card").style.display = "block";
            document.getElementById("company-btn").focus();
            displayCompanyProfile(data);
            Promise.all([await fetchStockSummary(ticker), await fetchRecommendation(ticker), await fetchHistoricalData(ticker), await fetchCompanyNews(ticker)]);
        }
    } catch (error) {
        console.error('Fetch error:', error.message);
        alert(error.message);
    }
}