import React, { useState, useMemo, useEffect, useRef } from "react";
import { ResponsiveContainer } from "recharts";
import { timeframeOptions } from "@/configs/networks";
import { useGlobalChartData, useGlobalData } from "@/contexts/GlobalData";
import { useMedia } from "react-use";
// import DropdownSelect from "../DropdownSelect";
import { CHART_TYPES } from "./TradingviewChart";
import { getTimeframe } from "@/utils/info";
import { Box, Button } from "@chakra-ui/react";
import dynamic from "next/dynamic";

const TradingViewChart = dynamic(() => import("./TradingviewChart"), {
  ssr: false,
});

const CHART_VIEW = {
  VOLUME: "Volume",
  LIQUIDITY: "Liquidity",
};

const VOLUME_WINDOW = {
  WEEKLY: "WEEKLY",
  DAYS: "DAYS",
};
const GlobalChart = ({ display }: { display: string }) => {
  // chart options
  const [chartView, setChartView] = useState(
    display === "volume" ? CHART_VIEW.VOLUME : CHART_VIEW.LIQUIDITY
  );

  // time window and window size for chart
  const timeWindow = timeframeOptions.ALL_TIME;
  const [volumeWindow, setVolumeWindow] = useState(VOLUME_WINDOW.DAYS);

  // global historical data
  const [dailyData, weeklyData] = useGlobalChartData();
  const {
    totalLiquidityUSD,
    oneDayVolumeUSD,
    volumeChangeUSD,
    liquidityChangeUSD,
    oneWeekVolume,
    weeklyVolumeChange,
  } = useGlobalData();

  // based on window, get starttim
  let utcStartTime = getTimeframe(timeWindow);

  const chartDataFiltered = useMemo(() => {
    let currentData =
      volumeWindow === VOLUME_WINDOW.DAYS ? dailyData : weeklyData;
    return (
      currentData &&
      Object.keys(currentData)
        ?.map((key) => {
          let item = currentData[key];
          if (item.date > utcStartTime) {
            return item;
          } else {
            return true;
          }
        })
        .filter((item) => {
          return !!item;
        })
    );
  }, [dailyData, utcStartTime, volumeWindow, weeklyData]);

  // update the width on a window resize
  const ref = useRef();
  const isClient = typeof window === "object";
  // @ts-expect-error
  const [width, setWidth] = useState(ref.current?.container?.clientWidth);

  // @ts-expect-error
  useEffect(() => {
    if (!isClient) {
      return false;
    }
    function handleResize() {
      // @ts-expect-error
      setWidth((ref?.current?.container?.clientWidth as any) ?? width);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient, width]); // Empty array ensures that effect is only run on mount and unmount

  return chartDataFiltered ? (
    <Box>
      {chartView === CHART_VIEW.LIQUIDITY && (
        <ResponsiveContainer aspect={60 / 28} ref={ref}>
          <TradingViewChart
            data={dailyData}
            base={totalLiquidityUSD}
            baseChange={liquidityChangeUSD}
            title="Liquidity"
            field="totalLiquidityUSD"
            width={width}
            type={CHART_TYPES.AREA}
          />
        </ResponsiveContainer>
      )}
    </Box>
  ) : null;
};

export default GlobalChart;
