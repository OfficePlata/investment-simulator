import React, { useState, useEffect } from "react";
import { Calendar, ArrowRight, RefreshCcw, Plus, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Product {
  name: string;
  price: number;
  monthlyRental: number;
  resaleValue: number;
  resalePercentage: number;
  maxProfit: number;
  rentalMonths: number;
  limit: number;
  nextType: string | null;
  description: string;
}

const PRODUCTS: Record<string, Product> = {
  "TYPE-D": {
    name: "ZEXABOX PRO Type-D",
    price: 4500000,
    monthlyRental: 506000,
    resaleValue: 3847500,
    resalePercentage: 85.5,
    maxProfit: 130.4,
    rentalMonths: 4,
    limit: 140,
    nextType: "TYPE-V",
    description: "新規購入可能",
  },
  "TYPE-V": {
    name: "ZEXABOX PRO Type-V",
    price: 3960000,
    monthlyRental: 440000,
    resaleValue: 3430000,
    resalePercentage: 86.6,
    maxProfit: 131,
    rentalMonths: 4,
    limit: 180,
    nextType: "TYPE-K",
    description: "TYPE-D所有者向け",
  },
  "TYPE-K": {
    name: "ZEXABOX PRO Type-K",
    price: 3430000,
    monthlyRental: 350000,
    resaleValue: 2710000,
    resalePercentage: 79.88,
    maxProfit: 130,
    rentalMonths: 4,
    limit: 180,
    nextType: "TYPE-X",
    description: "TYPE-V所有者向け",
  },
  "TYPE-X": {
    name: "ZEXABOX PRO Type-X",
    price: 2710000,
    monthlyRental: 275000,
    resaleValue: 2156000,
    resalePercentage: 79.56,
    maxProfit: 130,
    rentalMonths: 5,
    limit: 180,
    nextType: null,
    description: "TYPE-K所有者向け",
  },
};
// 前のコードの続きに以下を追加

interface DecisionType {
  month: number;
  fromType: string;
  action: 'upgrade' | 'resale';
  toType: string | null;
}

interface ProjectionData {
  month: string;
  monthNumber: number;
  activeTypes: string;
  investment: number;
  revenue: number;
  balance: number;
  monthlyRevenue: number;
  profitRate: string;
}

const InvestmentSimulator: React.FC = () => {
  const initialDate = new Date(2024, 3, 1);
  const [startDate, setStartDate] = useState<Date>(initialDate);
  const [currentType, setCurrentType] = useState<string>("TYPE-D");
  const [quantity, setQuantity] = useState<number>(1);
  const [projectionData, setProjectionData] = useState<ProjectionData[]>([]);
  const [decisions, setDecisions] = useState<DecisionType[]>([]);
  const [nextDecisionMonth, setNextDecisionMonth] = useState<number>(4);

  // formatMonth関数の追加
  const formatMonth = (date: Date): string => {
    return date
      .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit" })
      .replace("/", "/");
  };
 // formatMonth関数の後に追加

// 収益計算
const calculateProjection = () => {
  let data: ProjectionData[] = [];
  let currentDate = new Date(startDate);
  let investment = {
    type: currentType,
    quantity: quantity,
    purchaseDate: currentDate,
    monthsActive: 0
  };
  let totalInvestment = PRODUCTS[currentType].price * quantity;
  let totalRevenue = 0;
  let activeInvestments = [investment];

  for (let month = 0; month <= 24; month++) {
    let monthlyRevenue = 0;
    let monthDate = new Date(currentDate);
    monthDate.setMonth(monthDate.getMonth() + month);

    // 既存の投資からの収入計算
    activeInvestments.forEach(inv => {
      const monthsSincePurchase = Math.floor(
        (monthDate.getTime() - inv.purchaseDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      
      if (monthsSincePurchase >= 2) { // 購入翌々月から収入開始
        monthlyRevenue += PRODUCTS[inv.type].monthlyRental * inv.quantity;
      }

      // リセール時期の確認
      if (monthsSincePurchase === PRODUCTS[inv.type].rentalMonths) {
        totalRevenue += PRODUCTS[inv.type].resaleValue * inv.quantity;
      }
    });

    // 決定に基づく処理
    const decision = decisions.find(d => d.month === month);
    if (decision) {
      if (decision.action === "upgrade") {
        // 新しい機種の購入
        const newType = decision.toType as string;
        totalInvestment += PRODUCTS[newType].price * quantity;
        
        activeInvestments = [{
          type: newType,
          quantity: quantity,
          purchaseDate: monthDate,
          monthsActive: 0
        }];
      } else if (decision.action === "resale") {
        activeInvestments = [];
      }
    }

    totalRevenue += monthlyRevenue;

    // データ記録
    data.push({
      month: formatMonth(monthDate),
      monthNumber: month + 1,
      activeTypes: activeInvestments.map(inv => PRODUCTS[inv.type].name).join(", "),
      investment: totalInvestment,
      revenue: totalRevenue,
      balance: totalRevenue - totalInvestment,
      monthlyRevenue,
      profitRate: totalInvestment > 0 
        ? ((totalRevenue / totalInvestment - 1) * 100).toFixed(1) 
        : "0.0"
    });
  }

  setProjectionData(data);
};

// 機種変更または売却の決定処理
const handleDecision = (action: 'upgrade' | 'resale') => {
  const newDecision: DecisionType = {
    month: nextDecisionMonth,
    fromType: currentType,
    action,
    toType: action === "upgrade" ? PRODUCTS[currentType].nextType : null,
  };

  const newDecisions = [...decisions, newDecision];
  setDecisions(newDecisions);

  if (action === "upgrade" && PRODUCTS[currentType].nextType) {
    setCurrentType(PRODUCTS[currentType].nextType);
    setNextDecisionMonth(prev => prev + 4);
  }

  calculateProjection();
};

// 設定変更時に再計算
useEffect(() => {
  calculateProjection();
}, [startDate, quantity, currentType, decisions]); 
// useEffectの後に追加

return (
  <div className="max-w-7xl mx-auto p-4">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 設定パネル */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>投資設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">開始日</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={startDate.toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">購入台数</label>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-1 border rounded"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-medium">{quantity}台</span>
                  <button
                    className="p-1 border rounded"
                    onClick={() => setQuantity(Math.min(20, quantity + 1))}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">現在の機種</label>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{PRODUCTS[currentType].name}</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>購入価格:</span>
                      <span>{(PRODUCTS[currentType].price * quantity).toLocaleString()}円</span>
                    </div>
                    <div className="flex justify-between">
                      <span>月額収入:</span>
                      <span>
                        {(PRODUCTS[currentType].monthlyRental * quantity).toLocaleString()}円
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>売却価格:</span>
                      <span>
                        {(PRODUCTS[currentType].resaleValue * quantity).toLocaleString()}円
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4ヶ月後の決定ダイアログ */}
        {projectionData[nextDecisionMonth] && (
          <Card className="mt-4 border-2 border-blue-500">
            <CardHeader>
              <CardTitle>4ヶ月経過: 次のステップを選択</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="p-4 border rounded-lg hover:bg-gray-50"
                  onClick={() => handleDecision("resale")}
                >
                  <div className="flex items-center mb-2">
                    <RefreshCcw className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="font-semibold">リセール</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    売却価格: {(PRODUCTS[currentType].resaleValue * quantity).toLocaleString()}円
                  </p>
                </button>

                {PRODUCTS[currentType].nextType && (
                  <button
                    className="p-4 border rounded-lg hover:bg-gray-50"
                    onClick={() => handleDecision("upgrade")}
                  >
                    <div className="flex items-center mb-2">
                      <ArrowRight className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="font-semibold">
                        {PRODUCTS[PRODUCTS[currentType].nextType].name}へ機種変更
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      追加投資: 
                      {(PRODUCTS[PRODUCTS[currentType].nextType].price * quantity).toLocaleString()}円
                    </p>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {/* 投資履歴 */}
        {decisions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>投資履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {decisions.map((decision, index) => (
                    <div key={index} className="p-2 border rounded">
                      <div className="flex items-center">
                        <span className="text-sm">
                          {formatMonth(
                            new Date(startDate.getTime() + decision.month * 30 * 24 * 60 * 60 * 1000)
                          )}:
                        </span>
                        <span className="ml-2">
                          {decision.action === "upgrade"
                            ? `${PRODUCTS[decision.fromType].name}から${
                                PRODUCTS[decision.toType as string].name
                              }へ機種変更`
                            : `${PRODUCTS[decision.fromType].name}をリセール`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* グラフと表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>収益シミュレーション</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <LineChart width={700} height={300} data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    interval={1}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString()}円`}
                    labelFormatter={(label: string) => label}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="累計収入"
                    stroke="#4CAF50"
                  />
                  <Line
                    type="monotone"
                    dataKey="investment"
                    name="累計投資"
                    stroke="#2196F3"
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="収支"
                    stroke="#FF9800"
                  />
                </LineChart>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border p-2">時期</th>
                      <th className="border p-2">機種</th>
                      <th className="border p-2">月間収入</th>
                      <th className="border p-2">累計収支</th>
                      <th className="border p-2">収益率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectionData.map((data, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : ""}
                      >
                        <td className="border p-2">{data.month}</td>
                        <td className="border p-2">{data.activeTypes}</td>
                        <td className="border p-2 text-right">
                          {data.monthlyRevenue.toLocaleString()}円
                        </td>
                        <td className="border p-2 text-right">
                          {data.balance.toLocaleString()}円
                        </td>
                        <td className="border p-2 text-right">{data.profitRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSimulator;