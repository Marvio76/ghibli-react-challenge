import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

// URL da API pública do Studio Ghibli
const API_URL = "https://ghibliapi.vercel.app/films";

function App() {
  // Estados da aplicação
  const [films, setFilms] = useState([]);
  const [search, setSearch] = useState("");
  const [includeSynopsis, setIncludeSynopsis] = useState(false);
  const [sort, setSort] = useState("");
  const [filters, setFilters] = useState({
    watched: false,
    favorite: false,
    annotated: false,
    stars: 0
  });
  const [notes, setNotes] = useState(
    JSON.parse(localStorage.getItem("ghibliNotes") || "{}")
  );
   // Busca os filmes da API ao montar o componente
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        const extendedData = data.map((film) => ({
          ...film,
          watched: false,
          favorite: false
        }));
        setFilms(extendedData);
      });
  }, []);
  // Salva as anotações no localStorage sempre que mudam
  useEffect(() => {
    localStorage.setItem("ghibliNotes", JSON.stringify(notes));
  }, [notes]);

  const handleToggle = (id, key) => {
    setFilms((prev) =>
      prev.map((film) =>
        film.id === id ? { ...film, [key]: !film[key] } : film
      )
    );
  };
  // Atualiza anotação (texto) de um filme específico
  const handleNoteChange = (id, text) => {
    setNotes((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        text
      }
    }));
  };
  // Define a quantidade de estrelas atribuídas a um filme
  const handleRate = (id, stars) => {
    setNotes((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        stars
      }
    }));
  };
  // Aplica filtros e ordenação sobre a lista de filmes
  const filterAndSortFilms = () => {
    const term = search.toLowerCase();
    const filtered = films.filter((film) => {
      const matchTitle = film.title.toLowerCase().includes(term);
      const matchDesc =
        includeSynopsis && film.description.toLowerCase().includes(term);
      const matchText = term === "" || matchTitle || matchDesc;

      const hasNote = notes[film.id];
      const stars = hasNote?.stars || 0;

      return (
        matchText &&
        (!filters.watched || film.watched) &&
        (!filters.favorite || film.favorite) &&
        (!filters.annotated || hasNote) &&
        stars >= parseInt(filters.stars)
      );
    });
    // Ordenação conforme o critério selecionado
    switch (sort) {
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "duration":
        filtered.sort((a, b) => a.running_time - b.running_time);
        break;
      case "duration-desc":
        filtered.sort((a, b) => b.running_time - a.running_time);
        break;
      case "rt_score":
        filtered.sort((a, b) => a.rt_score - b.rt_score);
        break;
      case "rt_score-desc":
        filtered.sort((a, b) => b.rt_score - a.rt_score);
        break;
      default:
        break;
    }

    return filtered;
  };

  // Realça o texto buscado na sinopse (caso ativado)
  const highlightText = (text) => {
    if (!search || !includeSynopsis) return text;
    const regex = new RegExp(`(${search})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={i} style={{ backgroundColor: "yellow" }}>{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="container">
      <h1>🎬 Filmes do Studio Ghibli</h1>

      <div className="controls">
        <div className="barra-pesquisa">
          <img
            src="https://img.icons8.com/?size=100&id=59878&format=png&color=000000"
            alt="Lupa"
          />
          <input
            type="text"
            placeholder="Pesquisar filmes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label>
          <input
            type="checkbox"
            checked={includeSynopsis}
            onChange={(e) => setIncludeSynopsis(e.target.checked)}
          />
          Incluir sinopse
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Ordenar por</option>
          <option value="title">Título A-Z</option>
          <option value="title-desc">Título Z-A</option>
          <option value="duration">Duração ↑</option>
          <option value="duration-desc">Duração ↓</option>
          <option value="rt_score">Nota ↑</option>
          <option value="rt_score-desc">Nota ↓</option>
        </select>
      </div>

      <div className="filters">
        <label>
          <input
            type="checkbox"
            checked={filters.watched}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, watched: e.target.checked }))
            }
          />
          Assistido
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.favorite}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, favorite: e.target.checked }))
            }
          />
          Favorito
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.annotated}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, annotated: e.target.checked }))
            }
          />
          Com anotação
        </label>
        <label>
          Estrelas:
          <select
            value={filters.stars}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, stars: e.target.value }))
            }
          >
            <option value="0">Todas</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5</option>
          </select>
        </label>
      </div>

      <div className="film-list">
        {filterAndSortFilms().map((film) => (
          <div className="film-card" key={film.id}>
            <img src={film.image} alt={film.title} />
            <h2>
              {film.title} ({film.release_date})
            </h2>
            <p>
              <strong>Duração:</strong> {film.running_time} min
            </p>
            <p>
              <strong>Diretor:</strong> {film.director}
            </p>
            <p>
              <strong>Produtor:</strong> {film.producer}
            </p>
            <p>
              <strong>Nota:</strong> {film.rt_score}
            </p>
            <p>{highlightText(film.description)}</p>
            <div className="buttons">
              <button onClick={() => handleToggle(film.id, "watched")}>{
                film.watched ? "✔️ Assistido" : "Marcar como assistido"
              }</button>
              <button onClick={() => handleToggle(film.id, "favorite")}>{
                film.favorite ? "⭐ Favorito" : "Marcar como favorito"
              }</button>
            </div>
            <div className="notes">
              <textarea
                rows="2"
                placeholder="Anotação..."
                value={notes[film.id]?.text || ""}
                onChange={(e) => handleNoteChange(film.id, e.target.value)}
              ></textarea>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    onClick={() => handleRate(film.id, n)}
                    style={{
                      cursor: "pointer",
                      fontSize: 20,
                      color: (notes[film.id]?.stars || 0) >= n ? "gold" : "#aaa"
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
