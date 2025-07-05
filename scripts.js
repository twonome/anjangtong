// ★★★ 여기에 사장님의 파이어베이스 연결 정보(firebaseConfig)는 그대로 유지하세요 ★★★
const firebaseConfig = {
  apiKey: "AIzaSyAiKxmT16G1RmtmcGVfRU3wYo0CUc1KWq8",
  authDomain: "saddle-finder-3deb1.firebaseapp.com",
  projectId: "saddle-finder-3deb1",
  storageBucket: "saddle-finder-3deb1.firebasestorage.app",
  messagingSenderId: "529749925138",
  appId: "1:529749925138:web:2727193bf36a68e355e7cb"
};

// ★★★ =============================================================== ★★★

// Firebase 앱 초기화
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 사장님께서 알려주신 정확한 질문과 옵션 목록
const questions = [
    { key: '성별', question: '성별을 선택해 주세요', options: ['남', '여'] },
    { key: '좌골사이즈', question: '좌골사이즈를 선택해 주세요', options: ['모름', '100이하', '105이하', '110이하', '115이하', '120이하', '125이하', '130이하', '135이하', '140이하', '140초과'] },
    { key: '자전거', question: '자전거는 어떤 것을 타시나요?', options: ['로드', 'MTB', '그래블', '건너뛰기'] },
    { key: '얼마나 유연하세요?', question: '얼마나 유연하세요?', options: ['유연하지 않음', '보통', '유연함'] },
    { key: '라이딩 자세', question: '주로 어떤 자세로 라이딩 하시나요?', options: ['바로선 자세', '중간 자세', '에어로 자세'] },
    { key: '좌골통증', question: '좌골 통증은 얼마나 심하시나요?', options: ['없음', '약', '중약', '중', '중강', '강'] },
    { key: '회음부통증', question: '회음부 통증은 얼마나 심하시나요?', options: ['없음', '약', '중약', '중', '중강', '강'] },
    { key: '안장 포지션을 자주 변경하시나요?', question: '안장 포지션을 자주 변경하시나요?', options: ['적음', '보통', '많음'] },
    { key: '라이딩 거리', question: '주행하시는 라이딩 거리는 보통 어느정도 되시나요?', options: ['5km미만', '10km미만', '20km미만', '30km미만', '50km미만', '100km미만', '100km이상'] },
    { key: '레일 규격', question: '레일 규격을 선택해주세요', options: ['상관없음(위아래로물리는클램프)', '일반레일 7x7', '카본레일 7x9', '카본레일 7x10'] },
    { key: '가격', question: '원하시는 안장 새제품 가격대를 선택해주세요', options: ['상관없음', '10만원이하', '10만원대', '20만원대', '30만원대', '40만원이상'] }
];

let currentQuestionIndex = 0;
const answers = {};

//--- 시작 페이지(index.html)에서 사용하는 함수들 ---//
function startQuestionnaire() {
    const mainButtonContainer = document.getElementById('main-button-container');
    const categoryContainer = document.getElementById('category-container');
    const questionContainer = document.getElementById('question-container');

    if (mainButtonContainer) mainButtonContainer.style.display = 'none';
    if (categoryContainer) categoryContainer.style.display = 'none';
    if (questionContainer) {
        questionContainer.style.display = 'flex';
        showQuestion();
    }
}

function showCategory(field, value) {
    localStorage.setItem('filter_type', 'category');
    localStorage.setItem('category_field', field);
    localStorage.setItem('category_value', value);
    window.location.href = 'recommendations.html';
}

function showAllWithInfo() {
    localStorage.setItem('filter_type', 'info');
    window.location.href = 'recommendations.html';
}

//--- 질문 페이지(index.html)에서 사용하는 함수들 ---//
function showQuestion() {
    const questionContainer = document.getElementById('question-container');
    if (!questionContainer) return;
    questionContainer.innerHTML = '';

    const q = questions[currentQuestionIndex];
    const questionElement = document.createElement('h2');
    questionElement.textContent = q.question;
    questionContainer.appendChild(questionElement);

    q.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => {
            answers[q.key] = option;
            nextQuestion();
        };
        questionContainer.appendChild(button);
    });
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        localStorage.setItem('filter_type', 'questionnaire');
        localStorage.setItem('answers', JSON.stringify(answers));
        window.location.href = 'recommendations.html';
    }
}

//--- 결과 페이지(recommendations.html)에서 사용하는 함수 ---//
function renderSaddles(saddles, container, showInfo) {
    container.innerHTML = "";
    if (saddles.length === 0) {
        container.innerHTML = "<p>조건에 맞는 안장이 없습니다. 다른 옵션을 선택해보세요!</p>";
        return;
    }

    saddles.forEach(saddle => {
        const div = document.createElement('div');
        div.className = 'recommendation';
        if (saddle.url) {
            div.onclick = () => window.open(saddle.url, '_blank');
        }

        const img = document.createElement('img');
        img.src = saddle.img || 'images/placeholder.png';
        img.alt = saddle.name;

        const p = document.createElement('p');
        p.textContent = saddle.name;

        div.appendChild(img);
        div.appendChild(p);

        if (showInfo) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'info';
            const cutoutText = saddle.컷아웃 ? `컷아웃: ${saddle.컷아웃}` : '';
            const noseWidthText = saddle.앞코폭 ? `앞코폭: ${saddle.앞코폭}` : '';
            infoDiv.textContent = [cutoutText, noseWidthText].filter(Boolean).join(', ');
            if (infoDiv.textContent) div.appendChild(infoDiv);
        }
        
        container.appendChild(div);
    });
}

function loadRecommendations() {
    const container = document.querySelector('.recommendation-container');
    if (!container) return;

    const filterType = localStorage.getItem('filter_type');
    
    db.collection("saddles").get().then(querySnapshot => {
        const allSaddles = [];
        querySnapshot.forEach(doc => {
            allSaddles.push(doc.data());
        });

        let matchedSaddles = [];
        let showInfo = false;

        if (filterType === 'category') {
            const field = localStorage.getItem('category_field');
            const value = localStorage.getItem('category_value');
            
            // ★★★★★ 버그 수정 지점 ★★★★★
            // 데이터가 배열이든, "숏핏,3D안장" 같은 글자이든 모두 포함 여부를 확인하도록 수정
            matchedSaddles = allSaddles.filter(saddle => {
                const saddleValue = saddle[field]; // 예: saddle['태그']
                if (Array.isArray(saddleValue)) {
                    // 데이터가 ["숏핏", "3D안장"] 같은 배열일 경우
                    return saddleValue.includes(value);
                } else if (typeof saddleValue === 'string') {
                    // 데이터가 "숏핏,3D안장" 같은 글자일 경우
                    return saddleValue.includes(value);
                }
                return false;
            });

        } else if (filterType === 'info') {
            matchedSaddles = allSaddles;
            showInfo = true;
        } else if (filterType === 'questionnaire') {
            const savedAnswers = JSON.parse(localStorage.getItem('answers'));
            if (savedAnswers) {
                matchedSaddles = allSaddles.filter(saddle => {
                    return Object.keys(savedAnswers).every(key => {
                        const answer = savedAnswers[key];
                        if (answer === '상관없음' || answer === '모름' || answer === '건너뛰기') return true;
                        
                        const saddleValue = saddle[key];
                        if (Array.isArray(saddleValue)) {
                            return saddleValue.includes(answer);
                        } else if (typeof saddleValue === 'string') {
                            return saddleValue.includes(answer);
                        }
                        return saddleValue === answer;
                    });
                });
            }
        }
        
        renderSaddles(matchedSaddles, container, showInfo);
        
        localStorage.removeItem('filter_type');
        localStorage.removeItem('category_field');
        localStorage.removeItem('category_value');
        localStorage.removeItem('answers');

    }).catch(error => {
        console.error("Error getting documents: ", error);
        container.innerHTML = "<p>데이터를 불러오는 중 오류가 발생했습니다.</p>";
    });
}

// 페이지가 로드되면 어떤 작업을 할지 결정
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('recommendations')) {
        loadRecommendations();
    } else {
        // index.html에서는 버튼 클릭으로 시작하므로 특별히 할 작업 없음
    }
});
