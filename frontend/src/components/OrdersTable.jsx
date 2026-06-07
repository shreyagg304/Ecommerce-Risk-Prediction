import React from "react";

export default function OrdersTable({ orders }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "center"
      }}
    >
      <thead>
        <tr style={{ background: "#f1f5f9" }}>
          <th style={{ padding: 8 }}>Order</th>
          <th>Category</th>
          <th>Price</th>
          <th>Payment</th>
          <th>Returned</th>
        </tr>
      </thead>

      <tbody>
        {orders.map((o) => (
          <tr key={o.Order_ID}>
            <td style={{ padding: 8 }}>{o.Order_ID}</td>
            <td>{o.Product_Category}</td>
            <td>{o.Product_Price}</td>
            <td>{o.Payment_Method}</td>
            <td>{o.Returned}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
