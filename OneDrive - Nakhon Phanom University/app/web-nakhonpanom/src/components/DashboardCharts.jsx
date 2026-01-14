import React from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';

/**
 * DashboardCharts - แสดง Charts บน Overview tab
 */
export default function DashboardCharts({ pieData, barData, assigneeData }) {
    return (
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
            {/* Status Distribution - Pie Chart */}
            <div className="chart-card glass" style={{ padding: '24px', borderRadius: '20px', background: 'white' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>
                    สัดส่วนสถานะงาน
                </h3>
                <div style={{ height: '300px', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Department Workload - Bar Chart */}
            <div className="chart-card glass" style={{ padding: '24px', borderRadius: '20px', background: 'white' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>
                    ปริมาณงานแยกตามฝ่าย (เสร็จ vs คงค้าง)
                </h3>
                <div style={{ height: '300px', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Legend />
                            <Bar dataKey="completed" name="เสร็จสิ้น" fill="#1565c0" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="ongoing" name="คงค้าง" fill="#ef6c00" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Assignee Workload - Horizontal Bar Chart (Full Width) */}
            <div className="chart-card glass" style={{ gridColumn: '1 / -1', padding: '24px', borderRadius: '20px', background: 'white' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>
                    ปริมาณงานรายบุคคล (เสร็จ vs คงค้าง)
                </h3>
                <div style={{ height: '350px', minWidth: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                        <BarChart data={assigneeData} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Legend />
                            <Bar dataKey="completed" name="เสร็จสิ้น" stackId="a" fill="#1565c0" radius={[0, 0, 0, 0]} barSize={20} />
                            <Bar dataKey="ongoing" name="คงค้าง" stackId="a" fill="#ef6c00" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
