import React, { Fragment, Component } from "react";
import "../css-draftjs/Draft.css";
// import "../css-draftjs/inline-toolbar-plugin.css";
import "../css-draftjs/static-toolbar-plugin.css";
import "../css-draftjs/editorStyles.css";

import { updateEditorState } from "../ducks/editor";
import insertSuggestion from "./InsertSuggestion";
import {
  addSelectedChart,
  updateCursorPosition,
  updateEditorPosition,
  updateSuggestionList,
  deactivateSuggestions,
  addTextLink
} from "../ducks/ui";

import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import PropTypes from "prop-types";

import {
  EditorState,
  SelectionState,
  Modifier,
  AtomicBlockUtils,
  convertToRaw,
  convertFromRaw,
  CompositeDecorator,
  Entity
} from "draft-js";
import Editor, { createEditorStateWithText } from "draft-js-plugins-editor";
import createToolbarPlugin, { Separator } from "draft-js-static-toolbar-plugin";
import {
  ItalicButton,
  BoldButton,
  UnderlineButton,
  CodeButton,
  HeadlineOneButton,
  HeadlineTwoButton,
  HeadlineThreeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton
} from "draft-js-buttons";
import Chart from "./Chart";
import VisPanel from "./VisPanel";
import Suggestion from "./Suggestion";
import LinkText from "./LinkText";
import decorateComponentWithProps from "../utils/decorate_component_with_props";
import createTextLink from "./CreateTextLink";
import Link from "./ManualLink";
import AutoLink from "./AutoLink";
class HeadlinesPicker extends Component {
  componentDidMount() {
    setTimeout(() => {
      window.addEventListener("click", this.onWindowClick);
    });
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.onWindowClick);
  }

  onWindowClick = () =>
    // Call `onOverrideContent` again with `undefined`
    // so the toolbar can show its regular content again.
    this.props.onOverrideContent(undefined);

  render() {
    const buttons = [HeadlineOneButton, HeadlineTwoButton, HeadlineThreeButton];
    return (
      <div>
        {buttons.map((
          Button,
          i // eslint-disable-next-line
        ) => (
          <Button key={i} {...this.props} />
        ))}
      </div>
    );
  }
}

class HeadlinesButton extends Component {
  onClick = () =>
    // A button can call `onOverrideContent` to replace the content
    // of the toolbar. This can be useful for displaying sub
    // menus or requesting additional information from the user.
    this.props.onOverrideContent(HeadlinesPicker);

  render() {
    return (
      <div className="headlineButtonWrapper">
        <button onClick={this.onClick} className="headlineButton">
          H
        </button>
      </div>
    );
  }
}
const toolbarPlugin = createToolbarPlugin();
const { Toolbar } = toolbarPlugin;
const plugins = [toolbarPlugin];

const ChartBlock = ({
  contentState,
  block,
  blockProps: { content },
  ...rest
}) => {
  return (
    <div>
      <Chart id={content.id} specs={content.chartData} shouldUpdate={true} />
    </div>
  );
};

class MyEditor extends React.Component {
  constructor(props) {
    super(props);
    const compositeDecorator = new CompositeDecorator([
      {
        strategy: handleStrategy,
        component: decorateComponentWithProps(LinkText, EditorState)
      },
      {
        strategy: findLinkEntities,
        component: Link
      },
      {
        strategy: findAutoLinkEntities,
        component: AutoLink
      }
    ]);
    this.state = {
      editorState: EditorState.createEmpty(compositeDecorator),
      cursorPositionInEditor: {},
      editorPosition: {},
      focussedSuggestionIndex: 0,
      lastTypedWord: ""
    };
    this.handleEditorChange = this.handleEditorChange.bind(this);
    this.onDownArrow = this.onDownArrow.bind(this);
    this.onUpArrow = this.onUpArrow.bind(this);
    this.handleReturn = this.handleReturn.bind(this);
    this.onTab = this.onTab.bind(this);
    this.onEscape = this.onEscape.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
  }
  callbackFunction = (newEditorState, newContent) => {
    this.setState({ editorState: newEditorState });
  };
  handleEditorChange = editorState => {
    this.setState({ editorState: editorState });
    const rawContent = convertToRaw(editorState.getCurrentContent());
    //Only storing the RAW data of the editor
    this.props.updateEditorState(rawContent);

    const blocks = rawContent.blocks;
    // const allText = blocks
    //   .map(block => (!block.text.trim() && "\n") || block.text)
    //   .join("\n");

    //AUTOMATIC LINKING WHEN THE USER IS TYPING
    //Get the last word user typed before pressing the space
    let lastWord = blocks
      .slice(-1)[0]
      .text.split(" ")
      .slice(-2)[0];

    //check if the word exists in list of suggestions
    const suggestionList = this.props.ui.suggestions.listOfSuggestions;
    if (
      suggestionList.indexOf(lastWord) != -1 &&
      lastWord !== this.state.lastTypedWord
    ) {
      this.insertAutomaticLink(lastWord);
      this.setState({ lastTypedWord: lastWord });
    }
    //Updating chartsInEditor to store
    //TODO: It calls addSelectedChart fucntion on each key process! It shouldn't happen!
    //TODO: Explicity check if the entity contains a chart. now Links will also be entites!
    var ids = [];
    Object.keys(rawContent.entityMap).map(function(key) {
      if (rawContent.entityMap[key].type === "CHART") {
        var id = rawContent.entityMap[key].data.content.id;
        ids.push(id);
      }
    }, this);
    this.props.addSelectedChart(ids);

    //Computing the position of cursor relative to viewport for showing suggestions
    //https://github.com/facebook/draft-js/issues/45

    var selectionState = editorState.getSelection();
    var anchorKey = selectionState.getAnchorKey();
    var currentContent = editorState.getCurrentContent();
    var currentContentBlock = currentContent.getBlockForKey(anchorKey);
    var start = selectionState.getStartOffset();
    var end = selectionState.getEndOffset();
    var selectedText = currentContentBlock.getText().slice(start, end);
    if (start > 0) {
      var selection = window.getSelection();
      if (selection.anchorNode == null) return;
      var range = selection.getRangeAt(0);
      var cursorPosition = range.getBoundingClientRect();
      cursorPosition = JSON.parse(JSON.stringify(cursorPosition));
      this.setState({ cursorPositionInEditor: cursorPosition });
      this.props.updateCursorPosition(cursorPosition);
    }
  };
  onUpArrow(keyboardEvent) {
    keyboardEvent.preventDefault();

    if (this.state.focussedSuggestionIndex - 1 < 0) {
      this.setState({
        focussedSuggestionIndex:
          this.props.ui.suggestions.listOfSuggestions.length - 1
      });
    } else {
      this.setState({
        focussedSuggestionIndex:
          (this.state.focussedSuggestionIndex - 1) %
          this.props.ui.suggestions.listOfSuggestions.length
      });
    }
  }

  onDownArrow(keyboardEvent) {
    keyboardEvent.preventDefault();
    this.setState({
      focussedSuggestionIndex:
        (this.state.focussedSuggestionIndex + 1) %
        this.props.ui.suggestions.listOfSuggestions.length
    });
  }
  handleReturn() {
    //TODO: Fix this! It is not working at the moment!
    return true;
  }

  onTab(keyboardEvent) {
    keyboardEvent.preventDefault();
    const suggestionText = this.props.ui.suggestions.listOfSuggestions[
      this.state.focussedSuggestionIndex
    ];
    const newEditorState = insertSuggestion(
      suggestionText,
      this.state.editorState
    );
    this.setState({
      editorState: newEditorState,
      lastTypedWord: suggestionText
    });
    this.props.deactivateSuggestions();

    const link = createTextLink(suggestionText);
    this.props.addTextLink(link);
  }
  onEscape(keyboardEvent) {
    keyboardEvent && keyboardEvent.preventDefault();
    this.props.deactivateSuggestions();
  }

  onBlur() {
    //TODO: BUG The following logic doesn't work well with the click on suggestion item. Probably because that is implemented in a different Component
    // this.props.deactivateSuggestions();
  }

  onFocus() {}
  insertAutomaticLink(text) {
    //TODO: BUGFIX: Doesn't work as expected when block starts with a link or when the link contains one character
    const { editorState } = this.state;
    const currentContent = editorState.getCurrentContent();
    const currentSelection = editorState.getSelection();
    const blockKey = currentSelection.getAnchorKey();
    const currentBlock = currentContent.getBlockForKey(blockKey);
    const end = currentSelection.getAnchorOffset();
    const start = end - text.length;
    const entityKey = Entity.create("Auto-Link", "MUTABLE", "");

    const insertTextSelection = currentSelection.merge({
      anchorOffset: start,
      focusOffset: end
    });

    let newContent = Modifier.replaceText(
      editorState.getCurrentContent(),
      insertTextSelection,
      text,
      [], //inline styling
      entityKey
    );

    //add a white space after the entity
    //Recommendation by Draftjs community!
    const blockSize = editorState
      .getCurrentContent()
      .getBlockForKey(blockKey)
      .getLength();
    if (blockSize === end) {
      newContent = Modifier.insertText(
        newContent,
        newContent.getSelectionAfter(),
        " "
      );
    }

    const newEditorState = EditorState.push(
      editorState,
      newContent,
      "insert-auto-link"
    );

    this.setState({
      editorState: newEditorState
    });

    const link = createTextLink(text);
    this.props.addTextLink(link);
  }

  componentDidMount() {
    const rawEditorData = this.props.editor;
    const contentState = convertFromRaw(rawEditorData);
    this.setState({
      editorState: EditorState.createWithContent(contentState)
    });

    var editorNode = document.getElementById("mainEditor");
    var editorPosition = editorNode.getBoundingClientRect();
    editorPosition = JSON.parse(JSON.stringify(editorPosition));
    this.setState({ editorPosition: editorPosition });
    this.props.updateEditorPosition(editorPosition);
  }
  render() {
    const additionalProps = (() => {
      if (this.props.ui.suggestions.isActive) {
        return {
          onDownArrow: this.onDownArrow,
          onUpArrow: this.onUpArrow,
          handleReturn: this.handleReturn,
          onEscape: this.onEscape,
          onBlur: this.onBlur,
          onFocus: this.onFocus,
          onTab: this.onTab
        };
      } else {
        return {
          onDownArrow: undefined,
          onUpArrow: undefined,
          handleReturn: undefined,
          onEscape: undefined,
          onTab: undefined,
          onBlur: this.onBlur,
          onFocus: this.onFocus
        };
      }
    })();
    return (
      <div className="row">
        <div className="col">
          <VisPanel />
          <button
            className={"btn btn-primary btn-lg"}
            onClick={this.insertChart}
          >
            Add VIS
          </button>
        </div>
        <div className="col-9 editor" id="mainEditor">
          <Editor
            editorState={this.state.editorState}
            placeholder="Start composing an interactive article!"
            onChange={this.handleEditorChange}
            stripPastedStyles={true}
            blockRendererFn={this.blockRendererFn}
            plugins={plugins}
            {...additionalProps}
            ref={element => {
              this.editor = element;
            }}
          />
          <Toolbar>
            {// may be use React.Fragment instead of div to improve perfomance after React 16
            externalProps => (
              <div>
                <BoldButton {...externalProps} />
                <ItalicButton {...externalProps} />
                <UnderlineButton {...externalProps} />
                <CodeButton {...externalProps} />
                <Separator {...externalProps} />
                <HeadlinesButton {...externalProps} />
                <UnorderedListButton {...externalProps} />
                <OrderedListButton {...externalProps} />
                <BlockquoteButton {...externalProps} />
                <CodeBlockButton {...externalProps} />
              </div>
            )}
          </Toolbar>
        </div>
        <Suggestion
          suggestionCallback={this.callbackFunction}
          suggestionState={this.state.editorState}
          focussedSuggestionIndex={this.state.focussedSuggestionIndex}
        />
      </div>
    );
  }
  //Parsing ChartInEditor for extracting chart features from vegalite specs
  parseChartForFeatures = chartId => {
    let chart = this.props.charts.byId[chartId];
    let encodings = chart.specs.encoding;
    let data = chart.Data;
    var features = [];
    //Extract dimensions from Vega Specifications
    Object.keys(encodings).forEach(function(key) {
      //   console.log(key, encodings[key].field);
      features.push(encodings[key].field);
    });
    return features;
  };
  insertChart = () => {
    const { editorState } = this.state;
    let content = editorState.getCurrentContent();

    //Adding a random chart on button click!
    //Needs to replace with drag and drop feature!
    // var chartId = Math.floor(Math.random() * (4 - 3 + 1) + 3);
    var chartId = 5;
    var editorChartId = "e" + chartId;

    //Update Chart Specs with Signal Information
    var newChartSpecs = updateChartSpecsWithSignals(
      this.props.charts.byId[chartId].specs,
      this.props.charts.byId[chartId].type
    );

    content = content.createEntity("CHART", "IMMUTABLE", {
      content: {
        chartData: newChartSpecs,
        id: editorChartId
      }
    });
    const entityKey = content.getLastCreatedEntityKey();
    this.setState({
      editorState: AtomicBlockUtils.insertAtomicBlock(
        editorState,
        entityKey,
        " "
      )
    });
  };
  blockRendererFn = block => {
    const { editorState } = this.state;
    const content = editorState.getCurrentContent();

    if (block.getType() === "atomic") {
      const entityKey = block.getEntityAt(0);
      const entity = content.getEntity(entityKey);
      const entityData = entity.getData() || { content: "" };

      if (entity != null && entity.getType() === "CHART") {
        return {
          component: ChartBlock,
          props: {
            data: this.props.charts.byId,
            ...entityData
          }
        };
      }
    }
  };
}

/**
 * Super simple decorators for handles and hashtags, for demonstration
 * purposes only. Don't reuse these regexes.
 */
const HANDLE_REGEX = /\@[\w]+/g;

function handleStrategy(contentBlock, callback, contentState) {
  findWithRegex(HANDLE_REGEX, contentBlock, callback);
}

function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText();
  let matchArr, start;
  while ((matchArr = regex.exec(text)) !== null) {
    start = matchArr.index;
    callback(start, start + matchArr[0].length);
  }
}

function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "Link"
    );
  }, callback);
}
function findAutoLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges(character => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "Auto-Link"
    );
  }, callback);
}

function updateChartSpecsWithSignals(oldChartSpecs, chartType) {
  // console.log("Old Chart Specs:", oldChartSpecs);

  //I think this is not the right way to work with data cloning in Reactjs!
  //soultion Source: https://stackoverflow.com/questions/55567386/react-cannot-add-property-x-object-is-not-extensible
  let newChartSpecs = JSON.parse(JSON.stringify(oldChartSpecs));
  newChartSpecs.width = 350;
  newChartSpecs.height = 200;

  //Create a Highlight signal if doesn't exist already, else append it in signals
  const hasAlreadySignalsField = newChartSpecs.hasOwnProperty("signals");
  if (hasAlreadySignalsField) {
    newChartSpecs.signals.push({
      name: "signal_highlight",
      value: { data: [], start: 0, end: 100 }
    });
  } else {
    newChartSpecs.signals = [
      {
        name: "signal_highlight",
        value: { data: [], start: 0, end: 100 }
      }
    ];
  }
  //Case Stack-Bar chart
  if (chartType === "stack-bar") {
    const x = getVariableNameFromScale(newChartSpecs, "x");
    const y = getVariableNameFromScale(newChartSpecs, "y");
    const color = getVariableNameFromScale(newChartSpecs, "color");

    newChartSpecs.marks[0].encode.update = {
      fillOpacity: [
        {
          test:
            "indexof(signal_highlight.data,datum." +
            x +
            ") != -1 || (datum." +
            y +
            " > signal_highlight.data[0] && datum." +
            y +
            " < signal_highlight.data[1]) || indexof(signal_highlight.data,datum." +
            color +
            ") != -1",
          value: 1.0
        },
        { value: 0.6 }
      ]
    };
  }
  // Case Simple Bar chart
  else if (chartType === "bar") {
    const x = getVariableNameFromScale(newChartSpecs, "xscale");
    const y = getVariableNameFromScale(newChartSpecs, "yscale");

    newChartSpecs.marks[0].encode.update = {
      fill: { value: "steelblue" },
      fillOpacity: [
        {
          test:
            "indexof(signal_highlight.data,datum." +
            x +
            ") >= 0 || (datum." +
            y +
            " > signal_highlight.data[0] && datum." +
            y +
            " < signal_highlight.data[1])",
          value: 1.0
        },
        { value: 0.6 }
      ]
    };
  }
  // Case Multi-Line Chart
  else if (chartType === "multi-line") {
    const x = getVariableNameFromScale(newChartSpecs, "x");
    const y = getVariableNameFromScale(newChartSpecs, "y");
    const color = getVariableNameFromScale(newChartSpecs, "color");

    if (newChartSpecs.marks[0].marks[0].encode.hasOwnProperty("update")) {
      newChartSpecs.marks[0].marks[0].encode.update.strokeOpacity = [
        {
          test:
            "indexof(signal_highlight.data,datum." +
            x +
            ") !== -1 || (datum." +
            y +
            " > signal_highlight.data[0] && datum." +
            y +
            " < signal_highlight.data[1]) || indexof(signal_highlight.data,datum." +
            color +
            ") !== -1",
          value: 1.0
        },
        { value: 0.6 }
      ];
    } else {
      newChartSpecs.marks[0].marks[0].encode.update = {
        //TODO: BUG: When value is 0, it highlights both the lines!
        strokeOpacity: [
          {
            test:
              "indexof(signal_highlight.data,datum." +
              x +
              ") != -1 || (datum." +
              y +
              " > signal_highlight.data[0] && datum." +
              y +
              " < signal_highlight.data[1]) || indexof(signal_highlight.data,datum." +
              color +
              ") !== -1",
            value: 1.0
          },
          { value: 0.4 }
        ]
      };
    }
  }
  console.log("New Chart Specs:", newChartSpecs);
  return newChartSpecs;
}
function getVariableNameFromScale(specs, scaleName) {
  let varName = "infinity";
  const varScale = specs.scales.filter(s => {
    return s.name == scaleName;
  });
  if (varScale.length > 0) varName = varScale[0].domain.field;
  return varName;
}

//Define the public proptypes of this componenet
Editor.propTypes = {
  editor: PropTypes.object,
  updateEditorState: PropTypes.func,
  addSelectedChart: PropTypes.func
};
const mapStateToProps = (state, ownProps) => {
  return state;
};

const mapDispatchToProps = dispatch => {
  return {
    ...bindActionCreators(
      {
        updateEditorState,
        addSelectedChart,
        updateCursorPosition,
        updateEditorPosition,
        updateSuggestionList,
        deactivateSuggestions,
        addTextLink
      },
      dispatch
    )
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(MyEditor);
