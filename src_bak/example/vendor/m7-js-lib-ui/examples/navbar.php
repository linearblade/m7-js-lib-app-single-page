<nav class="navbar" aria-label="Main navigation">
  <div class="navbar__cell navbar__cell--title">
    <a class="navbar__brand" href="/">m7.org</a>
  </div>

  <div class="navbar__cell navbar__cell--hamburger">
    <button
      class="navbar__toggle"
      data-nav-trigger="menu"
      aria-controls="navbar-links-main"
      aria-expanded="false"
      aria-label="Toggle menu">
      Menu
    </button>
  </div>

  <div class="navbar__cell navbar__cell--nav">
    <ul class="navbar__links" id="navbar-links-main">
      <li><a href="/">Home</a></li>

      <li class="navbar__dropdown" nav-drop-behavior="auto">
        <a href="#" data-nav-trigger aria-controls="menu-products" aria-expanded="false">Products</a>
        <ul class="navbar__dropdown--menu" id="menu-products">
          <li><a href="/products">Overview</a></li>
          <li><a href="/products/pricing">Pricing</a></li>

          <li class="navbar__dropdown" nav-drop-behavior="auto">
            <a href="#" data-nav-trigger aria-controls="menu-guides" aria-expanded="false">Guides</a>
            <ul class="navbar__dropdown--menu" id="menu-guides">
              <li><a href="/guides/start">Getting Started</a></li>
              <li><a href="/guides/advanced">Advanced</a></li>
            </ul>
          </li>
        </ul>
      </li>

      <li><a href="/about">About</a></li>
    </ul>
  </div>
</nav>
