// ★★★ 여기에 사장님의 파이어베이스 연결 정보(firebaseConfig)를 붙여넣으세요 ★★★
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

// 새 질문 목록
const questions = [
    { key: '성별', question: '성별을 선택해 주세요', options: ['남', '여'] },
    { key: '좌골사이즈', question: '좌골사이즈를 선택해 주세요', options: ['모름', '100이하', '105이하', '110이하', '115이하', '120이하', '125이하', '130이하', '135이하', '140이하', '140초과'] },
    { key: '자전거', question: '자전거는 어떤 것을 타시나요?', options: ['로드/픽시', 'MTB/하이브리드'] },
    { key: '얼마나 유연하세요?', question: '얼마나 유연하세요?', options: ['유연함', '보통', '뻣뻣함'] },
    { key: '라이딩 자세', question: '주로 어떤 자세로 라이딩 하시나요?', options: ['공격적(숙여서)', '편안하게(세워서)'] },
    { key: '좌골통증', question: '좌골 통증은 얼마나 심하시나요?', options: ['없음', '약', '중', '강'] },
    { key: '회음부통증', question: '회음부 통증은 얼마나 심하시나요?', options: ['없음', '약', '중', '강'] },
    { key: '안장 포지션을 자주 변경하시나요?', question: '안장 포지션을 자주 변경하시나요?', options: ['네', '아니요'] },
    { key: '라이딩 거리', question: '주행하시는 라이딩 거리는 보통 어느정도 되시나요?', options: ['단거리(30km 미만)', '중거리(30-80km)', '장거리(80km 이상)'] },
    { key: '레일 규격', question: '레일 규격을 선택해주세요', options: ['상관없음', '일반레일(7x7)', '카본레일(7x9)', '카본레일(7x10)'] },
    { key: '가격', question: '원하시는 안장 새제품 가격대를 선택해주세요', options: ['상관없음', '10만원 이하', '10만원대', '20만원대', '30만원대', '40만원 이상'] }
];

let currentQuestionIndex = 0;
const answers = {};

//--- 시작 페이지(index.html)에서 사용하는 함수들 ---//

function startQuestionnaire() {
    document.getElementById('main-button-container').style.display = 'none';
    document.getElementById('category-container').style.display = 'none';
    document.getElementById('question-container').style.display = 'flex';
    showQuestion();
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
        img.src = saddle.img || 'images/placeholder.png'; // 이미지가 없을 경우 대체 이미지
        img.alt = saddle.name;

        const p = document.createElement('p');
        p.textContent = saddle.name;

        div.appendChild(img);
        div.appendChild(p);

        if (showInfo) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'info';
            const cutoutText = saddle.컷아웃 ? `컷아웃: ${saddle.컷아웃}` : '컷아웃: 정보없음';
            const noseWidthText = saddle.앞코폭 ? `앞코폭: ${saddle.앞코폭}` : '앞코폭: 정보없음';
            infoDiv.textContent = `${cutoutText}, ${noseWidthText}`;
            div.appendChild(infoDiv);
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
            matchedSaddles = allSaddles.filter(saddle => 
                Array.isArray(saddle[field]) && saddle[field].includes(value)
            );
        } else if (filterType === 'info') {
            matchedSaddles = allSaddles;
            showInfo = true;
        } else if (filterType === 'questionnaire') {
            const savedAnswers = JSON.parse(localStorage.getItem('answers'));
            if (savedAnswers) {
                matchedSaddles = allSaddles.filter(saddle => {
                    return Object.keys(savedAnswers).every(key => {
                        const answer = savedAnswers[key];
                        if (answer === '상관없음' || answer === '모름') return true;
                        return Array.isArray(saddle[key]) ? saddle[key].includes(answer) : saddle[key] === answer;
                    });
                });
            }
        }
        
        renderSaddles(matchedSaddles, container, showInfo);
        
        // 사용한 필터 정보 삭제
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
    // recommendation.html 페이지인 경우에만 추천 로직 실행
    if (document.body.classList.contains('recommendations')) {
        loadRecommendations();
    }
});