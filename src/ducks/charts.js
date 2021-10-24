import uniqueId from "utils/uniqueId";
import barChartSpec from "./specs/barchart.json";
import barChartLiteSpec from "./specs/barChartLite.json";
import { createSelector } from "reselect";

// action types
export const CREATE_CHART = "CREATE_CHART";
export const UPDATE_CHART = "UPDATE_CHART";
export const DELETE_CHART = "DELETE_CHART";

// actions
export const createChart = (docId, spec, liteSpec, attrs = {}) => {
    let chartId = uniqueId("chart-");
    attrs = {
        docId,
        spec,
        liteSpec,
        timestamp: Date.now(),
        highlight: { channel: "opacity", active: 1.0, inactive: 0.1 },
        ...attrs,
        id: chartId,
    };
    return { type: CREATE_CHART, chartId, attrs };
};

export const updateChart = (chartId, attrs) => {
    return { type: UPDATE_CHART, chartId, attrs };
};

export const deleteChart = (chartId, attrs) => {
    return {
        type: DELETE_CHART,
        chartId,
        attrs,
    };
};
// selectors
export const getCharts = createSelector(
    (state) => state.docs,
    (state) => state.charts,
    (_, docId) => docId,
    (docs, charts, docId) => docs[docId].charts.map((cid) => charts[cid])
);

export const getChartsInEditor = createSelector(
    (state) => state.docs,
    (state) => state.charts,
    (_, docId) => docId,
    (docs, charts, docId) => docs[docId].chartsInEditor.map((cid) => charts[cid])
);
// reducers
const initialState = {
    testchart: {
        id: "testchart",
        docId: "testdoc",
        timestamp: Date.now(),
        thumbnail:
            "data:image/png;base64,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Tp8+XcrKymTGjBkydepUKS0tlfnz53tDKYXaQQObQpfUIzb2y8Y+EStvGmajDG3sUxh6ZZx09+zZI926dZMVK1YI/l1eXi55eXneNCqF2nEVeApQWTkRhPFxEKtUENB/Jq7foHHSdUS0fv16admypdSvX19famnUjKvAU4GMWOmjRqyIlRsC1pCuW0f9/j026c477zy/m027PRv7ZWOfALSN/bKxT8TK22cZtAxjS7rexMDaRIAIEAF/EIgV6X755Zfy97//XX70ox+pE3A2FBv7ZAMu7EPmI4A9HBz9t7m88sor0rlzZxXK6leJFenu3btXzjrrLMHR4+uuu0569eolJ510kl9YptSOjX3CQPBBXHbZZUnH9Nhjj4WOHeKzzzzzzKR9mjZtmpx++ukpySGdh9Cv2t770ksvSadOndJ5hednbcUKA/nrX/8qd955pwwbNkwuvPBCuffee+Vf//qXDBo0SC655BLPYw3yAWzyDx8+XM4++2zfXhMr0nVQW7ZsmfLnYpbFybdrr71WrrzySmnatKlvwHptyLY+HThwQN54443KYdx6663qozjhhBNk8ODB8tRTT/mqiDp4ffHFF3LcccfJrFmzaqyOQPRGjRrpNOVrnUOHDqlTlE5BDpEXXnhBxo0bp/QL4ZDf+MY3fH2nW2Po0/vvv1+t2sqVK+WGG25QG9avv/66OnJvogCLxx9/XH784x8L0gAgYgk5V/Ados9HHXVU6N2C8VNTueKKK9SkQNL1QSRYLnz66acyZ84ceeihh+S1115Ts+2pp57qQ+upNWFjn5yRYJIaP368sm67dOmiPhY/FVEHMZAuPtiNGzfqVA+1zmeffSZ/+ctfZNKkSSpxU58+fdQpy29/+9uSlZUVal8SX7Z//355+OGHVX6T3/72t3LLLbeEFiWU2BeQKo78L126VP0KS3dYvJdeeqn069dPGT+JJ7iCBg961bhx46SvWbhwoa+6HktLF+iC4EaPHi3PPvuswG/TvXt3efTRR43N/rb2iaTr/skjQROss44dO8of//hHtYoyTbROr3Gk/pprrpF27dqpQ0g4Xm+yfP755+pbQ4QAJk9Y3Vu3blWrTEzozz//vJxxxhmhd3HHjh01vhMTJyYrPw2MWJEullywaHHy7emnn5bvfe97anb92c9+JkcffXTogsYLbexTTUD84he/EBzZ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",
        highlight: { channel: "opacity", active: 1.0, inactive: 0.1 },
        properties: {
            axes: [
                {
                    name: "x",
                    field: "category",
                    data: "data_0",
                    type: "ordinal",
                    title: "category",
                },
                { name: "y", field: "amount", data: "data_0", type: "linear", title: "amount" },
            ],
            features: [
                { value: "Apple", type: "string", field: "category", data: "data_0" },
                { value: "Amazon", type: "string", field: "category", data: "data_0" },
                { value: "Facebook", type: "string", field: "category", data: "data_0" },
                { value: "Netflix", type: "string", field: "category", data: "data_0" },
                { value: "Microsoft", type: "string", field: "category", data: "data_0" },
                { value: "Samsung", type: "string", field: "category", data: "data_0" },
                { value: "Twitter", type: "string", field: "category", data: "data_0" },
                { value: "Linkedin", type: "string", field: "category", data: "data_0" },
            ],
        },
        spec: barChartSpec,
        liteSpec: barChartLiteSpec,
    },
};

export default (state = initialState, action) => {
    switch (action.type) {
        case CREATE_CHART:
        case UPDATE_CHART:
            return {
                ...state,
                [action.chartId]: {
                    ...(state[action.chartId] || {}),
                    ...action.attrs,
                },
            };
        case DELETE_CHART: {
            let newState = {
                ...state,
            };
            delete newState[action.chartId];
            return newState;
        }

        default:
            return state;
    }
};
