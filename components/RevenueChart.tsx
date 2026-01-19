"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface RevenueChartProps {
  revenueData: Array<{ date: string; revenue: number; trades: number }>;
}

export function RevenueChart({ revenueData }: RevenueChartProps) {
  // ECharts configuration for revenue timeline
  const chartOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        top: "15%",
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        textStyle: {
          color: "#fff",
          fontSize: 13,
        },
        formatter: (params: any) => {
          const param = params[0];
          const date = param.axisValue;
          const revenue = param.value;
          const trades = revenueData.find((d) => d.date === date)?.trades || 0;

          return `
            <div style="padding: 4px;">
              <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">${date}</div>
              <div style="color: ${revenue >= 0 ? "#34d399" : "#f87171"}; font-weight: 600; font-size: 14px;">
                ${revenue >= 0 ? "+" : ""}${revenue.toFixed(2)}%
              </div>
              <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
                ${trades} ${trades === 1 ? "trade" : "trades"}
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: "category",
        data: revenueData.map((d) => d.date),
        axisLine: {
          lineStyle: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: false,
        },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (value: number) => `${value >= 0 ? "+" : ""}${value}%`,
        },
        splitLine: {
          lineStyle: {
            color: "rgba(255, 255, 255, 0.05)",
            type: "dashed",
          },
        },
      },
      series: [
        {
          name: "Revenue",
          type: "line",
          data: revenueData.map((d) => d.revenue),
          smooth: true,
          lineStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#8b5cf6" },
              { offset: 1, color: "#a78bfa" },
            ]),
            width: 3,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(139, 92, 246, 0.3)" },
              { offset: 1, color: "rgba(139, 92, 246, 0.05)" },
            ]),
          },
          symbol: "circle",
          symbolSize: 6,
          itemStyle: {
            color: "#8b5cf6",
            borderColor: "#fff",
            borderWidth: 2,
          },
        },
      ],
    };
  }, [revenueData]);

  return (
    <ReactECharts
      option={chartOption}
      style={{ height: "350px" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
