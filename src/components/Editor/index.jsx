import React, { Fragment, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import {
    EditorState,
    AtomicBlockUtils,
    RichUtils,
    convertToRaw,
    convertFromRaw,
    Modifier,
    ContentState,
} from "draft-js";

import DraftEditor from "draft-js-plugins-editor";

import css from "./index.module.css";

import EditorToolbar, { EditorPlugins } from "components/EditorToolbar";

import SuggestionPanel from "components/SuggestionPanel";
import PotentialLinkControls from "components/PotentialLinkControls";

import { updateDoc, updateChartsInEditor } from "ducks/docs";
import { createLinks, createLink, deleteLink } from "ducks/links";
import { getChartsInEditor, getCharts } from "ducks/charts";
import { setSelectedLink, setManualLinkId, exitManualLinkMode, setTextSelection } from "ducks/ui";

import editorDecorators from "utils/editorDecorators";
import findSuggestions from "utils/findSuggestions";
import findLinks from "utils/findLinks";
import insertLinks from "utils/insertLinks";
import getLastTypedWord from "utils/getLastTypedWord";
import getLastTypedSentence from "utils/getLastTypedSentence";
import getTextSelection from "utils/getTextSelection";
import highlightTextSelection from "utils/highlightTextSelection";
import deHighlightTextSelection from "utils/deHighlightTextSelection";
import getBlockText from "utils/getBlockText";

export default function Editor(props) {
    const dispatch = useDispatch();
    let { docId } = useParams();
    const doc = useSelector((state) => state.docs[docId]);
    const charts = useSelector((state) => getCharts(state, docId));
    const storedEditorState = useSelector((state) => state.docs[docId].editorRawState);
    const chartsInEditor = useSelector((state) => getChartsInEditor(state, docId));
    const selectedLink = useSelector((state) => state.ui.selectedLink);
    const allLinks = useSelector((state) => state.links);
    const exitManualLink = useSelector((state) => state.ui.exitManualLink);
    const manualLinkId = useSelector((state) => state.ui.manualLinkId);

    const textSelectionInStore = useSelector((state) => state.ui.textSelection);
    const [tempTextSelection, setTempTextSelection] = useState(textSelectionInStore);

    const editorEl = useRef(null); //https://reactjs.org/docs/hooks-reference.html#useref
    const [suggestions, setSuggestions] = useState([]);

    const contentState =
        storedEditorState === null
            ? EditorState.createEmpty().getCurrentContent()
            : convertFromRaw(storedEditorState);
    const [editorState, setEditorState] = useState(EditorState.createWithContent(contentState));

    const [currentSelectionState, setCurrentSelectionState] = useState(null);
    const [pastedText, setPastedText] = useState(null);
    const [blockText, setBlockText] = useState("");

    useEffect(() => {
        if (exitManualLink) {
            setEditorState(deHighlightTextSelection(currentSelectionState, editorState));
            editorEl.current.focus();
            dispatch(exitManualLinkMode(false));
            setCurrentSelectionState(null);
        }
    }, [exitManualLink]);

    useEffect(() => {
        if (exitManualLink && allLinks[manualLinkId] === undefined) {
            //clear selection in case no brushing and pressing 'Accept'
            setEditorState(deHighlightTextSelection(currentSelectionState, editorState));
            setCurrentSelectionState(null);
        }
        if (allLinks[manualLinkId]) {
            setEditorState(
                insertLinks([allLinks[manualLinkId]], editorState, currentSelectionState)
            );
            dispatch(setManualLinkId(null));
            setCurrentSelectionState(null);
        }
    }, [manualLinkId, exitManualLink]);

    useEffect(() => {
        const editorRawState = convertToRaw(editorState.getCurrentContent());
        dispatch(updateDoc(doc.id, { editorRawState }));
    }, [editorState]);

    useEffect(() => {
        const asyncExec = async () => {
            console.log("Find links now", blockText);
            if (blockText !== "") {
                const textObject = { text: blockText, startIndex: 0, endIndex: blockText.length };
                console.log("Text", textObject);
                const links = await findLinks(chartsInEditor, textObject);

                if (links.length > 0) {
                    const action = createLinks(doc.id, links); // need ids
                    setEditorState(insertLinks(action.links, editorState));
                    dispatch(action);
                }
                setBlockText("");
            }
        };
        asyncExec();
    }, [blockText]);

    async function handleEditorChange(editorState) {
        setEditorState(editorState);
        const editorRawState = convertToRaw(editorState.getCurrentContent());

        const lastTypedWord = getLastTypedWord(editorState);
        const lastSentence = getLastTypedSentence(editorState);

        console.log("Text", blockText);

        //Enable SuggestionMenu on @
        if (lastTypedWord.text.startsWith("@")) {
            const suggestions = findSuggestions(
                chartsInEditor,
                lastTypedWord.text.slice(1),
                lastTypedWord.startIndex
            );

            setSuggestions(suggestions);
        } else {
            setSuggestions([]);
        }

        // TODO: see if we can catch an event for adding or removing a chart.
        // Updating charts in store when a chart is added to or removed from document
        const entityMap = editorRawState.entityMap;
        const numCharts = Object.keys(entityMap).length;
        if (numCharts !== chartsInEditor.length) {
            const ids = Object.values(entityMap).reduce((acc, entity) => {
                if (entity.type === "CHART") {
                    acc.push(entity.data.id);
                }
                return acc;
            }, []);
            dispatch(updateChartsInEditor(doc.id, ids));
        }

        const currentSelection = editorState.getSelection();
        const caretPosition = currentSelection.getAnchorOffset();
        const activeBlockKey = currentSelection.getAnchorKey();
        //Hide the link accept/delete button when cursor not in link range
        //TODO: what if selection spans more than one block?
        if (selectedLink && activeBlockKey) {
            if (
                activeBlockKey !== selectedLink.blockKey ||
                caretPosition < selectedLink.startIndex ||
                caretPosition > selectedLink.endIndex
            ) {
                dispatch(setSelectedLink(null));
            }
        }

        console.log("editorRawState", editorRawState);

        let textSelection = getTextSelection(
            editorState.getCurrentContent(),
            currentSelection,
            " " //delimiter
        );
        //Hide the floating controls when no text is selected
        setTempTextSelection(textSelection);

        //search for suggestions on text selection
        if (textSelection) {
            const suggestions = findSuggestions(
                chartsInEditor,
                textSelection.text.trim(),
                textSelection.startIndex
            );
            suggestions.length !== 0
                ? setSuggestions(suggestions)
                : setSuggestions([{ text: "NoLinkFound!" }]);
        }

        if (pastedText) {
            const links = await findLinks(chartsInEditor, pastedText);

            if (links.length > 0) {
                const action = createLinks(doc.id, links); // need ids
                editorState = insertLinks(action.links, editorState);
                setEditorState(editorState);
                dispatch(action);
            }
            setPastedText(null);
        }
    }
    function handleReturn() {
        // setBlockText(getTextByOffset(editorState));
        // console.log("return", blockText);
        // return "handled";
    }

    function handleKeyCommand(command) {
        // handle common key bindings (e.g., bold, italic, etc.)
        const newEditorState = RichUtils.handleKeyCommand(editorState, command);
        if (newEditorState) {
            setEditorState(newEditorState);
            return "handled";
        }
        return "not-handled";
    }
    function handleTab(e) {
        e.preventDefault();
        e.stopPropagation();
        setBlockText(getBlockText(editorState));
        return "handled";
    }

    function handleDragOver(e) {
        // may need to throttle for performance
        e.preventDefault();
        e.stopPropagation();
        editorEl.current.focus();
        // e.persist(); //conflict with asynchronous setTimeout in throuttle:
        //https://stackoverflow.com/questions/38142880/react-js-throttle-mousemove-event-keep-throwing-event-persist-error
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const chartId = e.dataTransfer.getData("chartId");
        const chart = charts.find((d) => d.id === chartId);
        const exists = chartsInEditor.find((d) => d.id === chartId);
        // console.log(chartsInEditor, chartId, editorState.getCurrentContent().getEntityMap().mapEntries());
        if (chart && !exists) {
            insertChart(chart);
            e.dataTransfer.clearData();
        }
    }

    function blockRendererFn(block) {
        //TODO: is this necessary given the plugin is there
        // ChartBlock Removed
    }
    function insertChart(chart) {
        // console.log(chartId, charts[chart.id])
        let contentState = editorState.getCurrentContent();

        contentState = contentState.createEntity("CHART", "IMMUTABLE", {
            id: chart.id, // wil get chart info from store
        });
        const entityKey = contentState.getLastCreatedEntityKey();
        const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, " ");
        setEditorState(newEditorState);
    }
    function handleBlur() {
        setSuggestions([]);
    }
    function handleSuggestionSelected(suggestion) {
        //TODO: there should be a single place generating a link (see find links)
        const action = createLink(doc.id, {
            text: suggestion.text,
            feature: suggestion.feature,
            chartId: suggestion.chartId,
            active: false,
            type: "point", //TODO: range selection
            sentence: suggestion.text,
            data: [isNaN(Number(suggestion.text)) ? suggestion.text : Number(suggestion.text)],
            startIndex: suggestion.startIndex,
            endIndex: suggestion.startIndex + suggestion.text.length,
            isConfirmed: true,
        }); // need ids
        const newEditorState = insertLinks([action.attrs], editorState);
        dispatch(action);

        setSuggestions([]);
        setEditorState(newEditorState);
    }
    function handleCreateLinkSelect() {
        dispatch(exitManualLinkMode(false));
        setCurrentSelectionState(editorState.getSelection());
        setEditorState(highlightTextSelection(tempTextSelection, editorState));
    }

    function handleLinkDiscard(link) {
        //TODO: Some code is similar to insertLinks.js. Consider refactoring!
        const currentSelection = editorState.getSelection();
        let newContent = ContentState.createFromText("");
        const insertTextSelection = currentSelection.merge({
            anchorOffset: link.startIndex,
            focusOffset: link.endIndex,
        });
        newContent = Modifier.replaceText(
            editorState.getCurrentContent(),
            insertTextSelection,
            link.text,
            [] //inline styling
        );
        let newEditorState = EditorState.push(editorState, newContent, "apply-entity");
        let newSelection = newEditorState.getSelection().merge({
            focusOffset: link.endIndex,
            anchorOffset: link.endIndex,
        });
        newEditorState = EditorState.moveSelectionToEnd(newEditorState);
        newEditorState = EditorState.forceSelection(newEditorState, newSelection);
        setEditorState(newEditorState);

        dispatch(deleteLink(link.id));
    }
    function handleLinkAccept(linkId) {
        setEditorState(insertLinks([allLinks[linkId]], editorState, editorState.getSelection()));
    }
    async function handlePastedText(text) {
        const end = editorState.getSelection().getAnchorOffset() + text.length;
        const offset = end - text.length;

        setPastedText({
            text: text,
            startIndex: offset,
            endIndex: end,
        });
    }

    return (
        <Fragment>
            {<EditorToolbar />}
            <div className={css.editor} onDragOver={handleDragOver} onDrop={handleDrop}>
                <DraftEditor
                    editorState={editorState}
                    plugins={EditorPlugins}
                    onChange={handleEditorChange}
                    onBlur={handleBlur}
                    handleKeyCommand={handleKeyCommand}
                    blockRendererFn={blockRendererFn}
                    decorators={editorDecorators}
                    ref={editorEl}
                    handlePastedText={handlePastedText}
                    handleReturn={handleReturn}
                    onTab={handleTab}
                />
            </div>
            {suggestions.length >= 1 && chartsInEditor.length > 0 && (
                <SuggestionPanel
                    suggestions={suggestions.filter((s) => s.text !== "NoLinkFound!")}
                    textSelection={tempTextSelection}
                    onSelected={handleSuggestionSelected}
                    onCreateLinkSelect={handleCreateLinkSelect}
                />
            )}
            <PotentialLinkControls
                selectedLink={selectedLink}
                onDiscard={handleLinkDiscard}
                onAccept={handleLinkAccept}
            />
        </Fragment>
    );
}

//Define the public proptypes of this componenet
Editor.propTypes = {
    editor: PropTypes.object,
    updateEditorState: PropTypes.func,
    addSelectedChart: PropTypes.func,
};
