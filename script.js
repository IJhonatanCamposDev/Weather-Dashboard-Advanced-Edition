const form = document.querySelector("#form");
const input = document.querySelector("#city");

const tempEl = document.querySelector("#temp");
const humidityEl = document.querySelector("#humidity");
const windEl = document.querySelector("#wind");
const descriptionEl = document.querySelector("#description");
const iconEl = document.querySelector("#icon");

const API_KEY = CONFIG.API_KEY;

// FUNÇÃO PARA MUDAR TEMA CONFORME TEMPERATURA
function changeTheme(temp) {
  document.body.classList.remove("hot", "cold", "normal");

  if (temp >= 30) {
    document.body.classList.add("hot");
  } else if (temp <= 15) {
    document.body.classList.add("cold");
  } else {
    document.body.classList.add("normal");
  }
}

// BUSCAR CLIMA
async function getWeather(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=pt_br&appid=${API_KEY}`
  );

  if (!res.ok) throw new Error("Cidade não encontrada");

  return res.json();
}

// BUSCAR PREVISÃO
async function getForecast(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=pt_br&appid=${API_KEY}`
  );

  if (!res.ok) throw new Error("Erro ao buscar previsão");

  return res.json();
}

// RENDERIZAR PREVISÃO
function renderForecast(data) {
  const forecastEl = document.querySelector("#forecast");
  forecastEl.innerHTML = "";

  const days = data.list.filter(item =>
    item.dt_txt.includes("12:00:00")
  );

  days.forEach(day => {
    forecastEl.innerHTML += `
      <div class="card">
        <h3>${new Date(day.dt_txt).toLocaleDateString("pt-BR")}</h3>
        <p>${Math.round(day.main.temp)} °C</p>
      </div>
    `;
  });
}

// RENDERIZAR GRÁFICO
function renderChart(data) {
  const chart = document.querySelector("#chart");
  chart.innerHTML = "";

  data.list.slice(0, 8).forEach(item => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${item.main.temp * 3}px`;
    chart.appendChild(bar);
  });
}

// ATUALIZAR INTERFACE
async function updateWeather(rawCity) {
  const city = encodeURIComponent(rawCity);

  try {
    descriptionEl.textContent = "🔄 Buscando dados...";

    const weather = await getWeather(city);

    tempEl.textContent = `${Math.round(weather.main.temp)} °C`;
    humidityEl.textContent = `${weather.main.humidity} %`;
    windEl.textContent = `${Math.round(weather.wind.speed * 3.6)} km/h`;

    descriptionEl.textContent = weather.weather[0].description;

    const icon = weather.weather[0].icon;
    iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    changeTheme(weather.main.temp);

    const forecast = await getForecast(city);
    renderForecast(forecast);
    renderChart(forecast);

  } catch (error) {
    descriptionEl.textContent = `❌ ${error.message}`;
  }
}

// FORMULÁRIO
form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!input.value.trim()) return;

  const rawCity = input.value.trim();
  localStorage.setItem("lastCity", rawCity);

  updateWeather(rawCity);
});

// GEOLOCALIZAÇÃO AUTOMÁTICA
async function getByLocation(lat, lon) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`
  );

  const data = await res.json();
  updateWeather(data.name);
}

// AO ABRIR O SITE
window.onload = () => {
  const lastCity = localStorage.getItem("lastCity");

  if (lastCity) {
    input.value = lastCity;
    updateWeather(lastCity);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      getByLocation(pos.coords.latitude, pos.coords.longitude);
    });
  }
};
