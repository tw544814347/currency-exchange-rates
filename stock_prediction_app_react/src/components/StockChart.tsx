import React, { useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ChartOptions 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { StockChartData } from '../types/stock';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockChartProps {
  chartData: StockChartData[];
  companyName: string;
}

const StockChart: React.FC<StockChartProps> = ({ chartData, companyName }) => {
  const chartRef = useRef<ChartJS<"line">>(null);

  useEffect(() => {
    // 图表已经加载后的操作
    if (chartRef.current) {
      // 可以在这里添加图表绘制后的逻辑
    }
  }, [chartData]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${companyName} 股票价格`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `股价: $${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '价格 (USD)'
        }
      },
      x: {
        title: {
          display: true,
          text: '日期'
        }
      }
    }
  };

  const data = {
    labels: chartData.map(data => data.date),
    datasets: [
      {
        label: '收盘价',
        data: chartData.map(data => data.close),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: '开盘价',
        data: chartData.map(data => data.open),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

  return (
    <div className="graph">
      <Line ref={chartRef} options={options} data={data} />
    </div>
  );
};

export default StockChart; 