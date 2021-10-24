import React from "react";
import Fab from "@material-ui/core/Fab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import NavigationIcon from "@material-ui/icons/Navigation";
import Grid from "@material-ui/core/Grid";
import { Link as RouterLink } from "react-router-dom";
import DescriptionOutlinedIcon from "@material-ui/icons/DescriptionOutlined";
import StorageOutlinedIcon from "@material-ui/icons/StorageOutlined";
import OndemandVideoOutlinedIcon from "@material-ui/icons/OndemandVideoOutlined";
import VideocamOutlinedIcon from "@material-ui/icons/VideocamOutlined";
import CodeOutlinedIcon from "@material-ui/icons/CodeOutlined";
import ComputerOutlinedIcon from "@material-ui/icons/ComputerOutlined";
function Home() {
  return (
    <React.Fragment>
      <Typography variant="h2" gutterBottom>
        Kori: Interactive Synthesis of Text and Charts in Data Documents
      </Typography>
      <Grid container spacing={3} justify="center">
        <Grid item xs={6}>
          <Box marginBottom={2}>
            <Typography variant="body1" gutterBottom>
              Charts go hand in hand with text to communicate complex data and
              are widely adopted in news articles, online blogs, and academic
              papers. They provide graphical summaries of the data, while text
              explains the message and context. However, synthesizing
              information across text and charts is difficult; it requires
              readers to frequently shift their attention. We investigated ways
              to support the tight coupling of text and charts in data
              documents. To understand their interplay, we analyzed the design
              space of chart-text references through news articles and
              scientific papers. Informed by the analysis, we developed a
              mixed-initiative interface enabling users to construct interactive
              references between text and charts. It leverages natural language
              processing to automatically suggest references as well as allows
              users to manually construct other references effortlessly. A user
              study complemented with algorithmic evaluation of the system
              suggests that the interface provides an effective way to compose
              interactive data documents.
            </Typography>
          </Box>
          <Fab
            variant="extended"
            color="primary"
            aria-label="add"
            component={RouterLink}
            to="/docs"
          >
            <NavigationIcon />
            Get Started
          </Fab>
        </Grid>
        <Grid item xs={6}>
          <Box p={2}>
            <video
              width="100%"
              height="auto"
              autoplay
              controls
            >
              <source src="teaser.mp4" type="video/mp4" />
            </video>
          </Box>
        </Grid>
      </Grid>
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Publication Materials
        </Typography>
        <Button
          href="https://drive.google.com/uc?export=view&id=1t-EnacQODNS-CzRXPJbO5BCM4-wCZz5e"
          color="primary"
          startIcon={<DescriptionOutlinedIcon />}
        >
          Paper
        </Button>
        {"  "}
        <Button
          href="https://drive.google.com/uc?export=view&id=1XZJD622tyVFsDuM1IiRNeuqA1h76i9iO"
          color="primary"
          startIcon={<StorageOutlinedIcon />}
        >
          Data
        </Button>{" "}
        <Button
          href="https://github.com/playfuldata/kori/tree/master"
          color="primary"
          startIcon={<CodeOutlinedIcon />}
        >
          Code
        </Button>{" "}
        <Button
          href="https://youtu.be/WBiBj7bC2_g"
          color="primary"
          startIcon={<OndemandVideoOutlinedIcon />}
        >
          Presentation
        </Button>{" "}
        {/* <Button
          href="https://drive.google.com/uc?export=view&id=10iXGFLCJF8W_JCMiT6vHwVw8qpLyeHBT"
          color="primary"
          startIcon={<VideocamOutlinedIcon />}
        >
          Video
        </Button>{" "} */}
        <Button
          href="https://playfuldata.github.io/kori/"
          color="primary"
          startIcon={<ComputerOutlinedIcon />}
        >
          Software
        </Button>
      </Box>
    </React.Fragment>
  );
}

export default Home;
