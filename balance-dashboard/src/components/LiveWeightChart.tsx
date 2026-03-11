import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAppStore } from '@/renderer/store/appStore'

type ChartDataPoint = {
  time: number
  weight: number
}

export function LiveWeightChart() {
  const { weight, timestamp, serviceState } = useAppStore()
  const [data, setData] = useState<ChartDataPoint[]>([])

  useEffect(() => {
    if (serviceState !== 'running' || timestamp === null) return

    setData(prev => {
      const now = new Date(timestamp).getTime()
      // Keep last 60 data points (approx 60 seconds if polling at 1Hz)
      const newData = [...prev, { time: now, weight }]
      if (newData.length > 60) newData.shift()
      return newData
    })
  }, [weight, timestamp, serviceState])

  const formatTime = (time: number) => {
    return format(new Date(time), 'HH:mm:ss', { locale: fr })
  }

  return (
    <div className="h-[300px] w-full p-4 border border-border rounded-xl bg-card flex flex-col">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 shrink-0">Historique des pesées (60s)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatTime} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(val) => val.toFixed(1)}
              domain={['auto', 'auto']}
              width={50}
            />
            <Tooltip 
              labelFormatter={(label) => formatTime(label as number)}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3} 
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
