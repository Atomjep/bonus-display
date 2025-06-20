// --- HTML要素の取得 ---
const inputScreen = document.getElementById('input-screen');
const resultScreen = document.getElementById('result-screen');
const doneButton = document.getElementById('done-button');
const resetButton = document.getElementById('reset-button');
const priceInput = document.getElementById('price-input');
const priceDisplay = document.getElementById('price-display');
const startButton = document.getElementById('start-button');

// --- 設定値 ---
const REVEAL_DELAY = 1000; // 1桁ずつ確定するまでの時間（ミリ秒）
const ROLLING_DURATION = 500; // 高速切り替えの時間（ミリ秒）


let currentPrice = ''; // 最新の価格を保持する変数
let selectedCurrency = 'JPY'; // ★変更点: 選択された通貨を保持する変数（デフォルトは円）

// --- 「実行」ボタンの処理 ---
doneButton.addEventListener('click', () => {
    const price = priceInput.value;
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        alert('数値を入力してください。');
        return;
    }

    currentPrice = price; // 値を保存

    // ★変更点: 選択されている通貨を取得して保存
    const currencyChoice = document.querySelector('input[name="currency"]:checked');
    if (currencyChoice) {
        selectedCurrency = currencyChoice.value;
    }

    // 画面を切り替え
    inputScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
});

// --- 「もう一度」ボタンの処理 ---
resetButton.addEventListener('click', () => {
    // 画面を切り替え
    resultScreen.classList.add('hidden');
    inputScreen.classList.remove('hidden');

    // 入力欄と表示をクリア
    priceInput.value = '';
    priceDisplay.textContent = '';
});

// --- 「開始」ボタンの処理 ---
startButton.addEventListener('click', () => {
    if (!currentPrice) {
        alert('金額が入力されていません。');
        return;
    }

    runAnimation(currentPrice);
});


/**
 * 鑑定アニメーションを実行するメイン関数
 * @param {string} price - 入力された価格文字列
 */
async function runAnimation(price) {
    resetButton.disabled = true;
    priceDisplay.textContent = '';

    // ★変更点: 通貨ごとの設定を定義
    const currencySettings = {
        'JPY': { symbol: '¥', locale: 'ja-JP' },
        'USD': { symbol: '$', locale: 'en-US' }
    };
    const currentSetting = currencySettings[selectedCurrency];

    // toLocaleStringは直接画面表示には使いませんが、内部処理の参考に残します
    const formattedPrice = Number(price).toLocaleString(currentSetting.locale, {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    const priceWithoutYen = String(Number(price)); // カンマなしの純粋な数字文字列を取得

    const MAX_DIGIT_TEMPLATE = '#,###,###,###'; // 10桁分の枠を定義
    const spans = [];

    // ⑤ テンプレートに従ってspan生成
    for (let i = 0; i < MAX_DIGIT_TEMPLATE.length; i++) {
        const char = MAX_DIGIT_TEMPLATE[i];
        const span = document.createElement('span');

        if (char === ',') {
            // カンマは固定表示
            span.textContent = ',';
            span.classList.add('comma');
        } else {
            // 数字はローリング
            span.classList.add('rolling-digit');
            span._rollingInterval = setInterval(() => {
                span.textContent = Math.floor(Math.random() * 10);
            }, 50);
        }

        spans.push(span);
        priceDisplay.appendChild(span);
    }

    // 数字spanのみ抽出して、右詰めで値を埋める
    const digitSpans = spans.filter(s => !s.classList.contains('comma'));
    for (let i = priceWithoutYen.length - 1, j = digitSpans.length - 1; i >= 0; i--, j--) {
        const char = priceWithoutYen[i];
        const span = digitSpans[j];

        if (span._rollingInterval) {
            clearInterval(span._rollingInterval);
        }

        await new Promise(resolve => {
            const intervalId = setInterval(() => {
                span.textContent = Math.floor(Math.random() * 10);
            }, 50);

            setTimeout(() => {
                clearInterval(intervalId);
                span.textContent = char;
                resolve();
            }, ROLLING_DURATION);
        });

        await new Promise(resolve => setTimeout(resolve, REVEAL_DELAY));
    }

    // ⑥ 余分な数字spanを削除（左側）
    const numCount = priceWithoutYen.replace(/,/g, '').length;
    const extraDigits = digitSpans.length - numCount;
    for (let i = 0; i < extraDigits; i++) {
        digitSpans[i].remove();
    }

    // ⑦ 数字の左右どちらにもないカンマを削除
    const currentSpans = Array.from(priceDisplay.children);
    for (let i = 0; i < currentSpans.length; i++) {
        const span = currentSpans[i];
        if (span.classList.contains('comma')) {
            const prev = currentSpans[i - 1];
            const next = currentSpans[i + 1];
            if (!prev || prev.textContent === ',' || !/\d/.test(prev.textContent)) {
                span.remove();
                continue;
            }
            if (!next || next.textContent === ',' || !/\d/.test(next.textContent)) {
                span.remove();
            }
        }
    }

    // ★変更点: 選択された通貨の記号を追加（先頭）
    const symbolSpan = document.createElement('span');
    symbolSpan.classList.add('currency-symbol'); // 汎用的なクラス名に変更
    symbolSpan.textContent = currentSetting.symbol; // JPYなら'¥', USDなら'$'
    priceDisplay.insertBefore(symbolSpan, priceDisplay.firstChild);

    resetButton.disabled = false;
}
