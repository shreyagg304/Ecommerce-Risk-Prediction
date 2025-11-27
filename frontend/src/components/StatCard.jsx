import React from "react";

// export default function StatCard({title, value}){
//   return (
//     <div style={{flex:1, background:'#f8fafc', padding:16, borderRadius:8}}>
//       <div style={{fontSize:12, color:'#6b7280'}}>{title}</div>
//       <div style={{fontSize:22, fontWeight:700}}>{value}</div>
//     </div>
//   )
// }

export default function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
