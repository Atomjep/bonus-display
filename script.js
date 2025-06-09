// --- HTML要素の取得 ---
const inputScreen = document.getElementById('input-screen');
const resultScreen = document.getElementById('result-screen');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const priceInput = document.getElementById('price-input');
const priceDisplay = document.getElementById('price-display');

// --- 設定値 ---
const REVEAL_DELAY = 1000; // 1桁ずつ確定するまでの時間（ミリ秒）
const ROLLING_DURATION = 500; // 高速切り替えの時間（ミリ秒）

// --- 「開始」ボタンの処理 ---
startButton.addEventListener('click', () => {
    const price = priceInput.value;
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        alert('入力してください。');
        return;
    }

    // 画面を切り替え
    inputScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    // 鑑定アニメーションを開始
    runAnimation(price);
});

// --- 「もう一度鑑定する」ボタンの処理 ---
resetButton.addEventListener('click', () => {
    // 画面を切り替え
    resultScreen.classList.add('hidden');
    inputScreen.classList.remove('hidden');

    // 入力欄と表示をクリア
    priceInput.value = '';
    priceDisplay.textContent = '';
});


/**
 * 鑑定アニメーションを実行するメイン関数
 * @param {string} price - 入力された価格文字列
 */
async function runAnimation(price) {
    resetButton.disabled = true;
    priceDisplay.textContent = '';

    const formattedPrice = Number(price).toLocaleString('ja-JP', {
        style: 'currency',
        currency: 'JPY',
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

    // "円" を追加
    const yenSpan = document.createElement('span');
    yenSpan.textContent = '円';
    priceDisplay.appendChild(yenSpan);

    resetButton.disabled = false;
}