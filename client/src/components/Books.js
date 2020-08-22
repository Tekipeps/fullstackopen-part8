import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { ALL_BOOKS } from "../queries";

const Books = (props) => {
  const result = useQuery(ALL_BOOKS);
  const [genres, setGeneres] = useState([]);
  const [genre, setGenre] = useState("all");
  if (!props.show) {
    return null;
  }
  if (result.loading) {
    return <div>loading ...</div>;
  }
  // console.log(result.data.allBooks);
  const books = result.data.allBooks;

  books.forEach((book) => {
    for (let i = 0; i < book.genres.length; i++) {
      if (!genres.includes(book.genres[i])) {
        setGeneres([...genres, book.genres[i]]);
      }
    }
  });
  const booksToShow = () => {
    if (genre === "all") return books;
    return books.filter((book) => book.genres.includes(genre));
  };
  // console.log(booksToShow());
  // console.log(genre);
  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {booksToShow().map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        {genres.map((g, i) => (
          <button key={i} onClick={() => setGenre(g)}>
            {g}
          </button>
        ))}
        <button onClick={() => setGenre("all")}>all genres</button>
      </div>
    </div>
  );
};

export default Books;
