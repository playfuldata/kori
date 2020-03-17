//ThisComponent handles the look and feel of text that appears after the user presses @.
//It's functionality has been mostly replaced by 'Link' Component.
import React, { Component } from "react";
import css from "./LinkText.module.css";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";
import {
  addTextLink,
  activateTextLink,
  deactivateTextLink,
  activateSuggestions,
  deactivateSuggestions
} from "../ducks/ui";

class LinkText extends Component {
  constructor(props) {
    super(props);
  }
  state = {};
  componentDidMount() {
    //activate the suggestion dropdown as soon as user presses '@'
    this.props.activateSuggestions();
  }
  render() {
    return (
      <span
        className={css.linkText}
        onMouseOver={this.handleMouseOver}
        onMouseLeave={this.handleMouseLeave}
        data-offset-key={this.props.offsetKey}
      >
        {this.props.children}
      </span>
    );
  }
}

//Define the public proptypes of this componenet
const mapStateToProps = (state, ownProps) => {
  return state;
};

const mapDispatchToProps = dispatch => {
  return {
    ...bindActionCreators(
      {
        addTextLink,
        activateTextLink,
        deactivateTextLink,
        activateSuggestions,
        deactivateSuggestions
      },
      dispatch
    )
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(LinkText);
