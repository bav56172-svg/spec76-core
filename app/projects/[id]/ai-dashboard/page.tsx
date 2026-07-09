"use client";

import { useState } from "react";
import { useProjectContext } from "@/app/hooks/useProjectContext";

export default function AIDashboardPage() {
  const { project } = useProjectContext();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runRevenue() {
    setLoading(true);

    const res = await fetch("/api/ai/revenue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project,
        users: [],
        usageStats: {
          activeUsers: 25,
          paidUsers: 3,
          churn: "high",
        },
        pricing: {
          free: true,
          pro: 10,
          enterprise: 50,
        },
        market: {
          segment: "early stage SaaS",
        },
      }),
    });

    const result = await res.json();

    setData(result);
    setLoading(false);
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            💰 AI Revenue System
          </h1>
          <p className="text-gray-500">
            Финансовый интеллект продукта (CFO AI)
          </p>
        </div>

        <button
          onClick={runRevenue}
          className="rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
        >
          💰 Analyze Revenue
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-gray-500">
          AI анализирует доходы...
        </div>
      )}

      {/* RESULT */}
      {data && (
        <div className="space-y-6">

          {/* MODEL */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="text-xl font-bold">
              📊 Revenue Model
            </h2>
            <p>{data.revenue_model}</p>
          </div>

          {/* ISSUES */}
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <h2 className="font-bold text-red-600">
              🚨 Revenue Issues
            </h2>
            <ul className="list-disc pl-5">
              {data.current_issues?.map((i: string, idx: number) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>

          {/* LEAKS */}
          <div className="rounded-lg bg-orange-50 p-4 shadow">
            <h2 className="font-bold text-orange-600">
              💸 Revenue Leaks (утечки дохода)
            </h2>
            <ul className="list-disc pl-5">
              {data.leaks?.map((l: string, idx: number) => (
                <li key={idx}>{l}</li>
              ))}
            </ul>
          </div>

          {/* PRICING */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">
              💰 Pricing Strategy
            </h2>

            {data.pricing_strategy?.map((p: any, idx: number) => (
              <div key={idx} className="border p-3 mt-2">
                <b>{p.plan}</b>
                <p>{p.value}</p>
                <span className="text-gray-500 text-sm">
                  {p.price}
                </span>
              </div>
            ))}
          </div>

          {/* FEATURES */}
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <h2 className="font-bold text-green-700">
              🚀 High Value Features
            </h2>
            <ul className="list-disc pl-5">
              {data.high_value_features?.map((f: string, idx: number) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>

          {/* GROWTH */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-bold">
              📈 Predicted Revenue Growth
            </h2>
            <p>{data.predicted_revenue_growth}</p>
          </div>

        </div>
      )}

    </div>
  );
}