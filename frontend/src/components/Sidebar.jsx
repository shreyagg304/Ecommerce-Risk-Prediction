import React from "react";

export default function Sidebar({ onHome }){
  return (
    <div style={{width:240, background:'#0f172a', color:'white', padding:20}}>
      <div style={{fontSize:18, fontWeight:700, marginBottom:20}}>Return Risk</div>
      <div style={{cursor:'pointer', padding:8}} onClick={onHome}>Marketplace</div>
    </div>
  )
}
