# Awery320.github.io
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Boogie Cafe & Bistro Retkinia</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;700&display=swap');

  :root{
    --cream:#F3E9D2;
    --ink:#231F20;
    --mustard:#E8A93B;
    --rust:#C2542D;
    --teal:#2F6E6A;
    --pink:#D96C8C;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  html{scroll-behavior:smooth;}
  body{
    background:var(--cream);
    color:var(--ink);
    font-family:'Space Grotesk', sans-serif;
    overflow-x:hidden;
  }
  h1,h2,h3,.display{
    font-family:'Bebas Neue', sans-serif;
    letter-spacing:0.02em;
    line-height:0.9;
  }
  a{color:inherit; text-decoration:none;}

  /* --- Nav --- */
  nav{
    position:fixed; top:0; left:0; right:0; z-index:100;
    display:flex; justify-content:space-between; align-items:center;
    padding:18px 6vw;
    background:rgba(243,233,210,0.9);
    backdrop-filter:blur(6px);
    border-bottom:2px solid var(--ink);
  }
  nav .logo{font-family:'Bebas Neue'; font-size:1.6rem; letter-spacing:0.03em;}
  nav ul{list-style:none; display:flex; gap:28px;}
  nav ul li a{font-weight:500; font-size:0.95rem; text-transform:uppercase; letter-spacing:0.05em; position:relative;}
  nav ul li a::after{
    content:''; position:absolute; bottom:-4px; left:0; width:0%; height:2px; background:var(--rust);
    transition:width 0.25s ease;
  }
  nav ul li a:hover::after{width:100%;}
  @media (max-width:700px){ nav ul{display:none;} }

  /* --- Hero --- */
  .hero{
    min-height:100vh;
    display:flex; flex-direction:column; justify-content:center;
    padding:0 6vw;
    position:relative;
    background:
      radial-gradient(circle at 85% 20%, var(--mustard) 0%, transparent 40%),
      radial-gradient(circle at 10% 80%, var(--pink) 0%, transparent 35%),
      var(--cream);
  }
  .hero .eyebrow{
    font-weight:700; text-transform:uppercase; letter-spacing:0.2em;
    font-size:0.8rem; color:var(--rust); margin-bottom:14px;
  }
  .hero h1{
    font-size:clamp(3.5rem, 12vw, 9rem);
    color:var(--ink);
  }
  .hero h1 span{color:var(--rust);}
  .hero .sub{
    max-width:520px; margin-top:22px; font-size:1.15rem; color:#4a433f;
  }
  .hero .cta-row{
    margin-top:38px; display:flex; gap:16px; flex-wrap:wrap;
  }
  .btn{
    display:inline-block; padding:14px 30px;
    border:2px solid var(--ink); border-radius:40px;
    font-weight:700; text-transform:uppercase; letter-spacing:0.05em; font-size:0.85rem;
    transition:transform 0.2s ease, background 0.2s ease, color 0.2s ease;
  }
  .btn.solid{ background:var(--ink); color:var(--cream); }
  .btn:hover{ transform:translateY(-3px); }
  .btn.solid:hover{ background:var(--rust); border-color:var(--rust); }
  .btn.outline:hover{ background:var(--ink); color:var(--cream); }

  .vinyl{
    position:absolute; right:6vw; bottom:8vh;
    width:220px; height:220px; border-radius:50%;
    background:repeating-radial-gradient(circle, var(--ink) 0 2px, #3a3532 2px 8px);
    box-shadow:0 20px 50px rgba(0,0,0,0.25);
    animation:spin 12s linear infinite;
  }
  .vinyl::after{
    content:''; position:absolute; top:50%; left:50%; width:60px; height:60px;
    background:var(--mustard); border-radius:50%; transform:translate(-50%,-50%);
    box-shadow:0 0 0 4px var(--ink);
  }
  @keyframes spin{ to{ transform:rotate(360deg); } }
  @media (max-width:800px){ .vinyl{ display:none; } }

  /* --- Marquee strip --- */
  .marquee{
    background:var(--ink); color:var(--cream);
    overflow:hidden; white-space:nowrap; padding:14px 0;
    border-top:2px solid var(--ink); border-bottom:2px solid var(--ink);
  }
  .marquee div{
    display:inline-block; animation:scroll 22s linear infinite;
    font-family:'Bebas Neue'; font-size:1.4rem; letter-spacing:0.08em;
  }
  .marquee span{ margin:0 30px; color:var(--mustard); }
  @keyframes scroll{ from{ transform:translateX(0); } to{ transform:translateX(-50%); } }

  /* --- Section generic --- */
  section{ padding:110px 6vw; }
  .section-head{ margin-bottom:60px; }
  .section-head .num{ font-family:'Bebas Neue'; color:var(--rust); font-size:1rem; letter-spacing:0.2em; }
  .section-head h2{ font-size:clamp(2.5rem, 6vw, 4.5rem); margin-top:6px; }

  /* --- About --- */
  .about{ background:var(--teal); color:var(--cream); }
  .about .section-head .num{ color:var(--mustard); }
  .about-grid{ display:grid; grid-template-columns:1.1fr 0.9fr; gap:60px; align-items:start; }
  .about p{ font-size:1.15rem; line-height:1.7; margin-bottom:20px; color:#e9f2f1; }
  .tags{ display:flex; flex-wrap:wrap; gap:12px; margin-top:10px; }
  .tag{
    border:1.5px solid var(--mustard); color:var(--mustard);
    padding:8px 18px; border-radius:30px; font-size:0.85rem; text-transform:uppercase; letter-spacing:0.04em;
  }
  @media (max-width:800px){ .about-grid{ grid-template-columns:1fr; } }

  /* --- Menu --- */
  .menu{ background:var(--cream); }
  .menu-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-top:2px solid var(--ink); }
  .menu-item{
    border-bottom:2px solid var(--ink); border-right:2px solid var(--ink);
    padding:34px 26px; transition:background 0.25s ease;
  }
  .menu-item:nth-child(3n){ border-right:none; }
  .menu-item:hover{ background:var(--mustard); }
  .menu-item h3{ font-size:1.8rem; margin-bottom:10px; }
  .menu-item p{ font-size:0.95rem; color:#4a433f; line-height:1.5; }
  .menu-item .price{ display:block; margin-top:14px; font-weight:700; color:var(--rust); }
  @media (max-width:800px){
    .menu-grid{ grid-template-columns:1fr; }
    .menu-item{ border-right:none; }
  }

  /* --- Live music strip --- */
  .live{
    background:var(--rust); color:var(--cream); text-align:center;
    padding:90px 6vw;
  }
  .live h2{ font-size:clamp(2.5rem, 8vw, 5rem); }
  .live p{ max-width:560px; margin:20px auto 0; font-size:1.1rem; opacity:0.95; }

  /* --- Reviews --- */
  .reviews{ background:var(--cream); }
  .review-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
  .review-card{
    background:#fff; border:2px solid var(--ink); border-radius:14px; padding:28px;
    display:flex; flex-direction:column; gap:14px;
  }
  .stars{ color:var(--mustard); font-size:1.2rem; letter-spacing:2px; }
  .review-card p{ font-size:0.98rem; line-height:1.55; color:#3a332f; }
  .review-card .who{ font-weight:700; font-size:0.9rem; margin-top:auto; }
  @media (max-width:800px){ .review-grid{ grid-template-columns:1fr; } }

  .rating-badge{
    display:inline-flex; align-items:center; gap:10px; margin-top:40px;
    font-family:'Bebas Neue'; font-size:1.3rem;
  }
  .rating-badge .num{ background:var(--ink); color:var(--mustard); padding:6px 14px; border-radius:8px; }

  /* --- Visit / Contact --- */
  .visit{ background:var(--ink); color:var(--cream); }
  .visit-grid{ display:grid; grid-template-columns:1fr 1fr; gap:60px; }
  .visit h3{ color:var(--mustard); font-size:1.6rem; margin-bottom:16px; letter-spacing:0.05em; }
  .visit p, .visit a{ font-size:1.05rem; line-height:1.8; color:#e9e2d3; }
  .hours-row{ display:flex; justify-content:space-between; border-bottom:1px solid #454140; padding:8px 0; font-size:0.95rem; }
  @media (max-width:800px){ .visit-grid{ grid-template-columns:1fr; } }

  footer{
    text-align:center; padding:30px; background:var(--ink); color:#8b8380;
    font-size:0.8rem; border-top:1px solid #454140;
  }
</style>
</head>
<body>

<nav>
  <div class="logo">BOOGIE ☕ CAFE</div>
  <ul>
    <li><a href="#about">O nas</a></li>
    <li><a href="#menu">Menu</a></li>
    <li><a href="#live">Live music</a></li>
    <li><a href="#reviews">Opinie</a></li>
    <li><a href="#visit">Odwiedź nas</a></li>
  </ul>
</nav>

<section class="hero">
  <div class="eyebrow">Retkinia · Śniadania · Kawa · Muzyka na żywo</div>
  <h1>DOBRY <span>GROOVE.</span><br>DOBRA <span>KAWA.</span></h1>
  <p class="sub">Przytulne miejsce spotkań na Retkini — świeże, sycące śniadania, dania z klimatem i muzyka na żywo, która sprawia, że nie chce się stąd wychodzić.</p>
  <div class="cta-row">
    <a class="btn solid" href="tel:668002555">Zadzwoń: 668 002 555</a>
    <a class="btn outline" href="#menu">Zobacz menu</a>
  </div>
  <div class="vinyl"></div>
</section>

<div class="marquee">
  <div>ŚNIADANIA CAŁY DZIEŃ <span>★</span> OPCJE WEGAŃSKIE <span>★</span> OGRÓDEK LETNI <span>★</span> MUZYKA NA ŻYWO <span>★</span> 4,6 / 5 W GOOGLE <span>★</span> ŚNIADANIA CAŁY DZIEŃ <span>★</span> OPCJE WEGAŃSKIE <span>★</span> OGRÓDEK LETNI <span>★</span> MUZYKA NA ŻYWO <span>★</span> 4,6 / 5 W GOOGLE <span>★</span></div>
</div>

<section class="about" id="about">
  <div class="section-head">
    <div class="num">01 — O NAS</div>
    <h2>Miejsce, gdzie<br>zwalnia się tempo.</h2>
  </div>
  <div class="about-grid">
    <div>
      <p>Boogie Cafe & Bistro to przytulny zakątek na Retkini, stworzony dla wszystkich, którzy cenią dobre jedzenie, aromatyczną kawę i miłą atmosferę. Świeże składniki, domowe smaki i muzyka, która unosi się w tle — to nasza recepta na udany dzień.</p>
      <p>Niezależnie, czy wpadasz na szybką kawę przed pracą, leniwe niedzielne śniadanie, czy wieczór z muzyką na żywo — zawsze znajdziesz tu miejsce dla siebie.</p>
    </div>
    <div>
      <div class="tags">
        <span class="tag">Ogródek</span>
        <span class="tag">Dania wegańskie</span>
        <span class="tag">Muzyka na żywo</span>
        <span class="tag">Zamówienia na wynos</span>
        <span class="tag">Dostawa</span>
      </div>
    </div>
  </div>
</section>

<section class="menu" id="menu">
  <div class="section-head">
    <div class="num">02 — MENU</div>
    <h2>Coś dla każdego nastroju.</h2>
  </div>
  <div class="menu-grid">
    <div class="menu-item">
      <h3>Śniadania</h3>
      <p>Jajka po naszemu, tosty na zakwasie, owsianki i domowe granole — na dobry początek dnia.</p>
      <span class="price">20–32 zł</span>
    </div>
    <div class="menu-item">
      <h3>Kawa i napoje</h3>
      <p>Ziarna świeżo palone, klasyki i autorskie propozycje baristów. Też na wynos.</p>
      <span class="price">od 9 zł</span>
    </div>
    <div class="menu-item">
      <h3>Dania wegańskie</h3>
      <p>Roślinne wersje bistrowych klasyków — sycące, kolorowe i pełne smaku.</p>
      <span class="price">22–36 zł</span>
    </div>
    <div class="menu-item">
      <h3>Bistro</h3>
      <p>Sezonowe dania główne przygotowywane na miejscu ze świeżych składników.</p>
      <span class="price">28–40 zł</span>
    </div>
    <div class="menu-item">
      <h3>Słodkości</h3>
      <p>Domowe ciasta i desery — idealne do popołudniowej kawy.</p>
      <span class="price">14–20 zł</span>
    </div>
    <div class="menu-item">
      <h3>Na wynos</h3>
      <p>Całe menu dostępne z odbiorem własnym lub dostawą przez Pyszne.pl.</p>
      <span class="price">20–40 zł</span>
    </div>
  </div>
</section>

<section class="live" id="live">
  <h2>MUZYKA NA ŻYWO</h2>
  <p>Regularne wieczory z muzyką na żywo — sprawdź nasz Instagram, żeby nie przegapić najbliższego koncertu.</p>
</section>

<section class="reviews" id="reviews">
  <div class="section-head">
    <div class="num">03 — OPINIE</div>
    <h2>Co mówią goście.</h2>
    <div class="rating-badge"><span class="num">4,6</span> na podstawie ponad 1400 opinii w Google</div>
  </div>
  <div class="review-grid">
    <div class="review-card">
      <div class="stars">★★★★★</div>
      <p>Bardzo pyszne jedzenie, świeże składniki i świetnie doprawione potrawy. Obsługa miła i profesjonalna, a atmosfera bardzo przyjemna.</p>
      <div class="who">— Kamila Mila, Google</div>
    </div>
    <div class="review-card">
      <div class="stars">★★★★★</div>
      <p>To jedno z najlepszych miejsc na śniadanie, jakie odwiedziłem ze znajomymi. Wszystko tu się zgadza.</p>
      <div class="who">— Gość, Google</div>
    </div>
    <div class="review-card">
      <div class="stars">★★★★★</div>
      <p>Przepyszne dania, kapitalne połączenia smaków. Bardzo ładnie podane i zapakowane na wynos.</p>
      <div class="who">— Gość, Pyszne.pl</div>
    </div>
  </div>
</section>

<section class="visit" id="visit">
  <div class="visit-grid">
    <div>
      <h3>Adres</h3>
      <p>Al. Kardynała Stefana Wyszyńskiego 13<br>94-048 Łódź, Retkinia</p>
      <h3 style="margin-top:34px;">Kontakt</h3>
      <p><a href="tel:668002555">668 002 555</a><br><a href="https://www.instagram.com/boogiecafe_/" target="_blank">@boogiecafe_ na Instagramie</a></p>
    </div>
    <div>
      <h3>Godziny otwarcia</h3>
      <div class="hours-row"><span>Poniedziałek – Piątek</span><span>09:00 – 21:00</span></div>
      <div class="hours-row"><span>Sobota</span><span>09:00 – 21:00</span></div>
      <div class="hours-row"><span>Niedziela</span><span>09:00 – 21:00</span></div>
      <p style="margin-top:14px; font-size:0.85rem; color:#a89f95;">Godziny mogą się różnić w święta — zadzwoń, żeby potwierdzić.</p>
    </div>
  </div>
</section>

<footer>
  © 2026 Boogie Cafe & Bistro Retkinia · Łódź
</footer>

</body>
</html>
