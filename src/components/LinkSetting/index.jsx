import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { makeStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Typography from "@material-ui/core/Typography";
import { getChartsInEditor } from "ducks/charts";
import { ChartSetting } from "components/ChartSetting";

const useStyles = makeStyles((theme) => ({
    chartAvatars: {
        display: 'flex',
        '& > *': {
          margin: theme.spacing(1),
        },
      },
    root: {
      width: 300,
    },
    largeAvatar: {
        width: theme.spacing(7),
        height: theme.spacing(7),
      },
      largeAvatarActive: {
        width: theme.spacing(7),
        height: theme.spacing(7),
        border: '1px solid #5e5d5d'
      },
  }));

export default function LinkSetting() {
    const classes = useStyles();
    const { docId } = useParams();
    const chartsInEditor = useSelector((state) => getChartsInEditor(state, docId));

    const selectedLink = useSelector((state) => state.ui.selectedLink);
    const textSelection = useSelector((state) => state.ui.textSelection);

    const [selectedChart, setSelectedChart] = useState(null);

    let isRangeLink = false;
    let createNewLink = false;

    if(textSelection) {
        createNewLink = true; 
    }

    if (selectedLink){
        isRangeLink = selectedLink.hasOwnProperty('rangeMin') || selectedLink.hasOwnProperty('rangeMax');
    }

    function handleChartAvatarClick(chart){
        if(selectedChart != chart)
          setSelectedChart(chart);
        else setSelectedChart(null);
    }
  
    return createNewLink ? (
        <div className={classes.root}>
          <Typography variant="overline" display="block" gutterBottom>
              Link Setting
          </Typography>
          <div className={classes.chartAvatars}>
              {chartsInEditor.map((chart) => (
                  <Avatar key={chart.id} src={chart.thumbnail} variant='rounded' className={chart.id === selectedChart?.id ? classes.largeAvatarActive: classes.largeAvatar} onClick={() => handleChartAvatarClick(chart)} />
              ))}
          </div>
          {selectedChart && <ChartSetting textSelection={textSelection} chart={selectedChart} />}
      </div>
    ): "";
}