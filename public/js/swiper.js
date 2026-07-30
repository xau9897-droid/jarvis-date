let currentIndex = 0;
let isAnimating = false;

const cardInner = document.getElementById('profile-inner');
const passBtn = document.getElementById('pass-btn');
const likeBtn = document.getElementById('like-btn');
const actionBtns = document.getElementById('action-buttons');
const noMore = document.getElementById('no-more');
const matchModal = document.getElementById('match-modal');

function renderProfile(profile) {
  const hasPhoto = profile.photo;
  cardInner.innerHTML = `
    ${hasPhoto
      ? `<img src="/${profile.photo}" alt="${profile.name}" class="profile-photo">`
      : `<div class="profile-photo-placeholder">${profile.name[0]}</div>`
    }
    <div class="profile-info">
      <h2>${profile.name} <span class="age">${profile.age || ''}</span></h2>
      ${profile.location ? `<div class="loc">📍 ${profile.location}</div>` : ''}
      ${profile.bio ? `<div class="bio">${profile.bio}</div>` : ''}
    </div>
  `;
}

function showNext() {
  if (currentIndex < profiles.length) {
    renderProfile(profiles[currentIndex]);
    actionBtns.style.display = 'flex';
    noMore.style.display = 'none';
  } else {
    cardInner.innerHTML = '';
    actionBtns.style.display = 'none';
    noMore.style.display = 'block';
  }
}

function swipe(direction) {
  if (isAnimating || currentIndex >= profiles.length) return;
  isAnimating = true;

  const profile = profiles[currentIndex];
  cardInner.classList.add('swiping');
  cardInner.classList.add(direction === 'like' ? 'liked' : 'passed');

  fetch('/swipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ swiped_id: profile.id, direction })
  })
  .then(r => r.json())
  .then(data => {
    if (data.matched) {
      document.getElementById('match-name').textContent = profile.name;
      matchModal.style.display = 'flex';
    }
  })
  .catch(() => {});

  setTimeout(() => {
    cardInner.classList.remove('swiping', 'liked', 'passed');
    cardInner.style.transition = 'none';
    currentIndex++;
    showNext();
    setTimeout(() => { cardInner.style.transition = ''; }, 50);
    isAnimating = false;
  }, 300);
}

function closeMatch() {
  matchModal.style.display = 'none';
}

passBtn.addEventListener('click', () => swipe('pass'));
likeBtn.addEventListener('click', () => swipe('like'));

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') swipe('pass');
  if (e.key === 'ArrowRight') swipe('like');
});

let touchStartX = 0;
let touchStartY = 0;
let isDragging = false;

cardInner.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  isDragging = true;
  cardInner.style.transition = 'none';
});

cardInner.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;
  const rot = dx * 0.1;
  cardInner.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
  cardInner.style.opacity = 1 - Math.min(Math.abs(dx) / 300, 0.5);
});

cardInner.addEventListener('touchend', (e) => {
  isDragging = false;
  cardInner.style.transition = '';
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (dx > 100) swipe('like');
  else if (dx < -100) swipe('pass');
  else {
    cardInner.style.transform = '';
    cardInner.style.opacity = '';
  }
});

showNext();
