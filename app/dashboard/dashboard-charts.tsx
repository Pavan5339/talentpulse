"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

export function DashboardCharts({ 
  verdictStats, 
  activityTimeline 
}: { 
  verdictStats: { name: string, value: number, color: string }[],
  activityTimeline: { date: string, interviews: number }[]
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 mt-8 mb-8">
      
      {/* Activity Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Interviews Over Time (7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {activityTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  fontSize={12} 
                  tickMargin={10} 
                  tick={{ fill: "#888888" }}
                />
                <YAxis 
                  allowDecimals={false} 
                  tickLine={false} 
                  axisLine={false} 
                  fontSize={12} 
                  tick={{ fill: "#888888" }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="interviews" 
                  fill="#0f172a" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
               No activity data available.
             </div>
          )}
        </CardContent>
      </Card>

      {/* AI Verdicts Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">AI Verdict Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
           {verdictStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie
                      data={verdictStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                  >
                      {verdictStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
              </ResponsiveContainer>
           ) : (
               <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                   No completed evaluations yet.
               </div>
           )}
        </CardContent>
      </Card>
      
    </div>
  )
}
