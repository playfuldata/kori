import React from "react";
import Fab from "@material-ui/core/Fab";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import NavigationIcon from "@material-ui/icons/Navigation";
import Grid from "@material-ui/core/Grid";
import { Link } from "react-router-dom";
function Home() {
    return (
        <React.Fragment>
            <Typography variant="h2" gutterBottom>
                KORI
            </Typography>
            <Grid container spacing={3} justify="center">
                <Grid item xs={6}>

                    <Box marginBottom={2}>
                        <Typography variant="body1" gutterBottom>
                            Charts go hand in hand with text to communicate complex data and are widely adopted in news articles, online blogs, and academic papers. They provide graphical summaries of the data, while text explains the message and context. However, synthesizing information across text and charts is difficult; it requires readers to frequently shift their attention. We investigated ways to support the tight coupling of text and charts in data documents. To understand their interplay, we analyzed the design space of chart-text references through news articles and scientific papers. Informed by the analysis, we developed a mixed-initiative interface enabling users to construct interactive references between text and charts. It leverages natural language processing to automatically suggest references as well as allows users to manually construct other references effortlessly. A user study complemented with algorithmic evaluation of the system suggests that the interface provides an effective way to compose interactive data documents.
                        </Typography>
                    </Box>
                    <Fab
                        variant="extended"
                        color="primary"
                        aria-label="add"
                        component={Link}
                        to="/docs"
                    >
                        <NavigationIcon />
                        Get Started
                    </Fab>
                </Grid>
                <Grid item xs={6} style={{overflow:"hidden"}}>
                    <video width="110%" height="auto" autoPlay style={{marginLeft:"-5%"}}>
                        <source src="teaser.mp4" type="video/mp4" />
                    </video>

                </Grid>
            </Grid>
        </React.Fragment>

    );
}

export default Home;
