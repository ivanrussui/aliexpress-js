'use strict';
document.addEventListener('DOMContentLoaded', () => {

  const search = document.querySelector('.search'),
    cartBtn = document.getElementById('cart'),
    wishlistBtn = document.getElementById('wishlist'),
    goodsWrapper = document.querySelector('.goods-wrapper'),
    cart = document.querySelector('.cart'),
    category = document.querySelector('.category'),
    cardCounter = cartBtn.querySelector('.counter'),
    wishlistCounter = wishlistBtn.querySelector('.counter'),
    cartWrapper = document.querySelector('.cart-wrapper');

  const wishlist = [];

  let goodsBasket = {};

  const loading = (nameFunction) => {
    const spinner = `<div id="spinner"><div class="spinner-loading">
    <div><div><div></div>
    </div><div><div></div></div>
    <div><div></div></div><div>
    <div></div></div></div></div></div>`;

    if (nameFunction === 'renderCard'){
      goodsWrapper.innerHTML = spinner;
    }

    if (nameFunction === 'renderBasket'){
      cartWrapper.innerHTML = spinner;
    }

  };


  // Запрос на сервер
  const getGoods = (handler, filter) => {
    loading(handler.name);
    fetch('./db/db.json')
      .then(responce => responce.json())
      .then(filter)
      .then(handler);
  };


  // Генерация карточек
  const createCardGoods = (id, title, price, img) => {
    const card = document.createElement('div');
    card.className = 'card-wrapper col-12 col-md-6 col-lg-4 col-xl-3 pb-3';
    card.innerHTML = `
    <div class="card">
      <div class="card-img-wrapper">
        <img class="card-img-top" src="${img}" alt="">
        <button class="card-add-wishlist ${wishlist.includes(id) ? 'active' : ''}" 
          data-goods-id="${id}"></button>
      </div>
      <div class="card-body justify-content-between">
        <a href="#" class="card-title">${title}</a>
        <div class="card-price">${price} ₽</div>
        <div>
          <button class="card-add-cart" data-goods-id="${id}">
            Добавить в корзину
          </button>
        </div>
      </div>
    </div>`;

    return card;

  };

  const createCardGoodsBasket = (id, title, price, img) => {
    const card = document.createElement('div');
    card.className = 'goods';
    card.innerHTML = `
    <div class="goods-img-wrapper">
      <img class="goods-img" src="${img}" alt="">

    </div>
    <div class="goods-description">
      <h2 class="goods-title">${title}</h2>
      <p class="goods-price">${price} ₽</p>

    </div>
    <div class="goods-price-count">
      <div class="goods-trigger">
        <button class="goods-add-wishlist ${wishlist.includes(id) ? 'active' : ''}"
          data-goods-id="${id}"></button>
        <button class="goods-delete" data-goods-id="${id}"></button>
      </div>
      <div class="goods-count">${goodsBasket[id]}</div>
    </div>`;

    return card;

  };
  

  // Рендеры
  const renderCard = goods => {
    goodsWrapper.textContent = '';

    if (goods.length) {
      goods.forEach(({ id, title, price, imgMin }) => {     
        goodsWrapper.append(createCardGoods(id, title, price, imgMin));
      });
    } else {
      goodsWrapper.textContent = '❌ Извините,  мы не нашли товаров по вашему запросу!';
    }

  };

  const renderBasket = goods => {
    cartWrapper.textContent = '';

    if (goods.length) {
      goods.forEach(({ id, title, price, imgMin }) => {     
        cartWrapper.append(createCardGoodsBasket(id, title, price, imgMin));
      });
    } else {
      cartWrapper.innerHTML = '<div id="cart-empty">Ваша корзина пока пуста</div>';
    }

  };


  // Калькуляция
  const calcTotalPrice = goods => {

    let sum = goods.reduce((accum, item) => {
      return accum + item.price * goodsBasket[item.id];
    }, 0)

    cart.querySelector('.cart-total>span').textContent = sum.toFixed(2);
  }

  const checkCount = () => {
    wishlistCounter.textContent = wishlist.length;
    cardCounter.textContent = Object.keys(goodsBasket).length;
  };


  // Фильтры
  const showCardBasket = goods => {
    const basketGoods = goods.filter(item => goodsBasket.hasOwnProperty(item.id));
    calcTotalPrice(basketGoods);
    return basketGoods;
  };

  const showWishList = () => {
    getGoods(renderCard, goods => goods.filter(item => wishlist.includes(item.id)))
  }; 

  const randomSoft = goods => goods.sort(() => Math.random() - 0.5);


  // Работа с хранилищем
  const getCookie = name => {
    let matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  };

  const cookieQuery = get => {

    if (get) {
      if (getCookie('goodsBasket')) {
        Object.assign(goodsBasket, JSON.parse(getCookie('goodsBasket')));
      }
      checkCount();
    } else {
      document.cookie = `goodsBasket=${JSON.stringify(goodsBasket)}; max-age=86400e3`;
    }  
  };

  const storageQuery = get => {

    if (get) {
      if (localStorage.getItem('wishlist')) {
        wishlist.push(...JSON.parse(localStorage.getItem('wishlist')));
      }
      checkCount();
    } else {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    
  };


  // События
  const closeCart = event => {
    const target = event.target;

    if(target === cart ||
      target.classList.contains('cart-close') ||
      event.keyCode === 27) {
      cart.style.display = '';
      document.removeEventListener('keyup', closeCart);
    }  
  };

  const openCart = event => {
    event.preventDefault();
    cart.style.display = 'flex';
    document.addEventListener('keyup', closeCart);
    getGoods(renderBasket, showCardBasket);
  };

  const choiseCategory = event => {
    event.preventDefault();
    const target = event.target;

    if (target.classList.contains('category-item')) {
      const cat = target.dataset.category;
      getGoods(renderCard, goods => goods.filter((item) => item.category.includes(cat)));
    }
  };

  const searchGoods = event => {
    event.preventDefault();

    const input = event.target.elements.searchGoods;
    const inputValue = input.value.trim();
    if (inputValue !== '') {
      const searchString = new RegExp(inputValue, 'i');
      getGoods(renderCard, goods => goods.filter((item) => searchString.test(item.title)));
    } else {
      search.classList.add('error');
      setTimeout( () => {
        search.classList.remove('error');
      }, 2000);
    }

    input.value = '';

  };

  const toggleWhishList = (id, elem) => {
    if (wishlist.includes(id)) {
        wishlist.splice(wishlist.indexOf(id), 1);
        elem.classList.remove('active')
    } else {
        wishlist.push(id);
        elem.classList.add('active')
    }

    checkCount();
    storageQuery();
  };

  const addBasket = id => {
    if (goodsBasket[id]) {
        goodsBasket[id] += 1
    } else {
        goodsBasket[id] = 1
    }
    
    checkCount();
    cookieQuery();
  };

  const removeGoods = id => {
    delete goodsBasket[id];
    checkCount();
    cookieQuery();
    getGoods(renderBasket, showCardBasket);
  };


  // handler
  const handlerGoods = event => {
    const target = event.target;

    if (target.classList.contains('card-add-wishlist')) {
      toggleWhishList(target.dataset.goodsId, target);
    };

    if(target.classList.contains('card-add-cart')) {
      addBasket(target.dataset.goodsId);
    }

  };

  const handlerBasket = event => {
    const target = event.target;

    if (target.classList.contains('goods-add-wishlist')) {
      toggleWhishList(target.dataset.goodsId, target);
    };

    if (target.classList.contains('goods-delete')) {
      removeGoods(target.dataset.goodsId);
    };

  }


  // Инициализация
  {
  getGoods(renderCard, randomSoft);
  storageQuery('get');
  cookieQuery('get');

  cartBtn.addEventListener('click', openCart);
  cart.addEventListener('click', closeCart);
  category.addEventListener('click', choiseCategory);
  search.addEventListener('submit', searchGoods);
  goodsWrapper.addEventListener('click', handlerGoods);
  cartWrapper.addEventListener('click', handlerBasket);
  wishlistBtn.addEventListener('click', showWishList)
  }


});
