import React from "react";
import css from "./index.module.css";

import { useDispatch, useSelector } from "react-redux";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import PropTypes from "prop-types";
import { setSelectedLink } from "ducks/ui";
import { confirmLink, deleteLink } from "ducks/links";

export default function PotentialLinkControls(props) {
    const dispatch = useDispatch();
    const selection = window.getSelection();
    const pos = selection.rangeCount > 0 ? selection.getRangeAt(0).getBoundingClientRect() : null;

    const padding = 10;

    function handleDiscardClick(event) {
        console.log("handleClick", "DISCARD");
        event.preventDefault();
        event.stopPropagation();
        props.onDiscard(props.selectedLink);

        dispatch(setSelectedLink(null));
    }
    function handleAcceptClick(event) {
        console.log("handleClick", "ACCEPT");
        event.preventDefault();
        event.stopPropagation();

        dispatch(confirmLink(props.selectedLink.id));
        dispatch(setSelectedLink(null));
    }
    return pos && props.selectedLink ? (
        <Box
            zIndex="modal"
            left={pos.x + padding}
            top={pos.y + padding}
            className={css.potentialLinkControls}
        >
            <ButtonGroup size="small" aria-label="small outlined button group">
                <Button onMouseDown={handleAcceptClick}>Accept</Button>
                <Button onMouseDown={handleDiscardClick}>Discard</Button>
            </ButtonGroup>
        </Box>
    ) : (
        ""
    );
}

PotentialLinkControls.propTypes = {
    suggestions: PropTypes.array,
    onSelected: PropTypes.func,
};
