import React from "react";
import Navbar from "./components/Navbar";
import Editor from "./components/Editor";
import Chart from "./components/Chart";
import VisCreator from "./components/VisCreator";
import Reader from "./components/Reader";

import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import "./App.css";

function App() {
  return (
    <React.Fragment>
      <Router>
        <Navbar />
        <Switch>
          <Route path="/viscreator">
            <VisCreator />
          </Route>
          <Route path="/reader">
            <Reader />
          </Route>
          <Route path="/">
            <Editor />
          </Route>
        </Switch>
      </Router>
    </React.Fragment>
  );
}

export default App;
