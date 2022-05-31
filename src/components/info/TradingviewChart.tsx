import React, { useState, useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { usePrevious } from "react-use";
import { Box, Icon } from "@chakra-ui/react";
import { FiPlay } from "react-icons/fi";

dayjs.extend(utc);

export const CHART_TYPES = {
  BAR: "BAR",
  AREA: "AREA",
};

// constant height for charts
const HEIGHT = 300;

const TradingViewChart = ({
  type = CHART_TYPES.BAR,
  data,
  base,
  baseChange,
  field,
  title,
  width,
  useWeekly = false,
}: any) => {
  // reference for DOM element to create with chart
  const ref: any = useRef();

  // pointer to the chart object
  const [chartCreated, setChartCreated] = useState<any>(false);
  const dataPrev = usePrevious(data);

  useEffect(() => {
    if (data !== dataPrev && chartCreated && type === CHART_TYPES.BAR) {
      // remove the tooltip element
      let tooltip = document.getElementById("tooltip-id" + type);
      let node = document.getElementById("test-id" + type);
      if (!tooltip || !node) return;
      node.removeChild(tooltip);
      chartCreated.resize(0, 0);
      setChartCreated(undefined);
    }
  }, [chartCreated, data, dataPrev, type]);

  // parese the data and format for tardingview consumption
  const formattedData = data?.map((entry: any) => {
    return {
      time: dayjs.unix(entry.date).utc().format("YYYY-MM-DD"),
      value: parseFloat(entry[field]),
    };
  });

  // adjust the scale based on the type of chart
  const topScale = type === CHART_TYPES.AREA ? 0.32 : 0.2;

  const darkMode = true;
  const textColor = darkMode ? "white" : "black";
  const previousTheme = usePrevious(darkMode);

  // reset the chart if them switches
  useEffect(() => {
    if (chartCreated && previousTheme !== darkMode) {
      // remove the tooltip element
      let tooltip = document.getElementById("tooltip-id" + type);
      let node = document.getElementById("test-id" + type);
      if (!tooltip || !node) return;
      node.removeChild(tooltip);
      chartCreated.resize(0, 0);
      setChartCreated(undefined);
    }
  }, [chartCreated, darkMode, previousTheme, type]);

  // if no chart created yet, create one with options and add to DOM manually
  useEffect(() => {
    if (!chartCreated && formattedData) {
      if (!ref.current) return;
      // const chart = createChart(ref.current, {
      //   width: width,
      //   height: HEIGHT,
      //   layout: {
      //     backgroundColor: "transparent",
      //     textColor: textColor,
      //   },
      //   rightPriceScale: {
      //     scaleMargins: {
      //       top: topScale,
      //       bottom: 0,
      //     },
      //     borderVisible: false,
      //   },
      //   timeScale: {
      //     borderVisible: false,
      //   },
      //   grid: {
      //     horzLines: {
      //       color: "rgba(197, 203, 206, 0.5)",
      //       visible: false,
      //     },
      //     vertLines: {
      //       color: "rgba(197, 203, 206, 0.5)",
      //       visible: false,
      //     },
      //   },
      //   crosshair: {
      //     horzLine: {
      //       visible: false,
      //       labelVisible: false,
      //     },
      //     vertLine: {
      //       visible: true,
      //       style: 0,
      //       width: 2,
      //       color: "rgba(32, 38, 46, 0.1)",
      //       labelVisible: false,
      //     },
      //   },
      //   localization: {
      //     priceFormatter: (val: any) => val,
      //   },
      // });
      // const series =
      //   type === CHART_TYPES.BAR
      //     ? chart.addHistogramSeries({
      //         color: "#ff007a",
      //         priceFormat: {
      //           type: "volume",
      //         },
      //         scaleMargins: {
      //           top: 0.32,
      //           bottom: 0,
      //         },
      //         baseLineColor: "#ff007a",
      //         baseLineWidth: 3,
      //       })
      //     : chart.addAreaSeries({
      //         topColor: "#ff007a",
      //         bottomColor: "rgba(255, 0, 122, 0)",
      //         lineColor: "#ff007a",
      //         lineWidth: 3,
      //       });
      // series.setData(formattedData);
      // const toolTip = document.createElement("div");
      // toolTip.setAttribute("id", "tooltip-id" + type);
      // toolTip.className = darkMode
      //   ? "three-line-legend-dark"
      //   : "three-line-legend";
      // if (!ref.current) return;
      // ref.current?.appendChild(toolTip);
      // toolTip.style.display = "block";
      // toolTip.style.fontWeight = "500";
      // toolTip.style.left = -4 + "px";
      // toolTip.style.top = "-" + 8 + "px";
      // toolTip.style.backgroundColor = "transparent";
      // // format numbers
      // let percentChange = baseChange?.toFixed(2);
      // let formattedPercentChange =
      //   (percentChange > 0 ? "+" : "") + percentChange + "%";
      // let color = percentChange >= 0 ? "green" : "red";
      // // get the title of the chart
      // toolTip.innerHTML =
      //   `<div style="font-size: 16px; margin: 4px 0px; color: ${textColor};">${title} ${
      //     type === CHART_TYPES.BAR && !useWeekly ? "(24hr)" : ""
      //   }</div>` +
      //   `<div style="font-size: 22px; margin: 4px 0px; color:${textColor}" >` +
      //   base +
      //   `<span style="margin-left: 10px; font-size: 16px; color: ${color};">${formattedPercentChange}</span>` +
      //   "</div>";
      // update the title when hovering on the chart
      //   chart.subscribeCrosshairMove(function (param: any) {
      //     if (
      //       param === undefined ||
      //       param.time === undefined ||
      //       param.point.x < 0 ||
      //       param.point.x > width ||
      //       param.point.y < 0 ||
      //       param.point.y > HEIGHT
      //     ) {
      //       toolTip.innerHTML =
      //         `<div style="font-size: 16px; margin: 4px 0px; color: ${textColor};">${title} ${
      //           type === CHART_TYPES.BAR && !useWeekly ? "(24hr)" : ""
      //         }</div>` +
      //         `<div style="font-size: 22px; margin: 4px 0px; color:${textColor}" >` +
      //         base +
      //         `<span style="margin-left: 10px; font-size: 16px; color: ${color};">${formattedPercentChange}</span>` +
      //         "</div>";
      //     } else {
      //       let dateStr = useWeekly
      //         ? dayjs(
      //             param.time.year + "-" + param.time.month + "-" + param.time.day
      //           )
      //             .startOf("week")
      //             .format("MMMM D, YYYY") +
      //           "-" +
      //           dayjs(
      //             param.time.year + "-" + param.time.month + "-" + param.time.day
      //           )
      //             .endOf("week")
      //             .format("MMMM D, YYYY")
      //         : dayjs(
      //             param.time.year + "-" + param.time.month + "-" + param.time.day
      //           ).format("MMMM D, YYYY");
      //       var price = param.seriesPrices.get(series);
      //       toolTip.innerHTML =
      //         `<div style="font-size: 16px; margin: 4px 0px; color: ${textColor};">${title}</div>` +
      //         `<div style="font-size: 22px; margin: 4px 0px; color: ${textColor}">` +
      //         price +
      //         "</div>" +
      //         "<div>" +
      //         dateStr +
      //         "</div>";
      //     }
      //   });
      //   chart.timeScale().fitContent();
      //   setChartCreated(chart);
    }
  }, [
    base,
    baseChange,
    chartCreated,
    darkMode,
    data,
    formattedData,
    textColor,
    title,
    topScale,
    type,
    useWeekly,
    width,
  ]);

  // responsiveness
  useEffect(() => {
    if (width) {
      chartCreated && chartCreated.resize(width, HEIGHT);
      chartCreated && chartCreated.timeScale().scrollToPosition(0);
    }
  }, [chartCreated, width]);

  useEffect(() => {
    // const chart = createChart(ref.current, { width: 400, height: 300 });
    // const lineSeries = chart.addLineSeries();
    // lineSeries.setData([
    //   { time: "2019-04-11", value: 80.01 },
    //   { time: "2019-04-12", value: 96.63 },
    //   { time: "2019-04-13", value: 76.64 },
    //   { time: "2019-04-14", value: 81.89 },
    //   { time: "2019-04-15", value: 74.43 },
    //   { time: "2019-04-16", value: 80.01 },
    //   { time: "2019-04-17", value: 96.63 },
    //   { time: "2019-04-18", value: 76.64 },
    //   { time: "2019-04-19", value: 81.89 },
    //   { time: "2019-04-20", value: 74.43 },
    // ]);
  }, []);

  return (
    <Box style={{ position: "relative" }}>
      <div ref={ref} id={"test-id" + type} />
      <Icon
        // onClick={() => {
        //   chartCreated && chartCreated.timeScale().fitContent();
        // }}
        as={FiPlay}
      />
    </Box>
  );
};

export default TradingViewChart;
