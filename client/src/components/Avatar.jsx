import React from "react";

export default function Avatar({ user, size = 40, online }) {
  const initials = (user?.username || "?").slice(0, 2).toUpperCase();
  const style = { width: size, height: size };

  return (
    <div className="relative shrink-0" style={style}>
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="w-full h-full rounded-full object-cover border border-border"
        />
      ) : (
        <div
          className="w-full h-full rounded-full bg-primary text-bubbleMe-text flex items-center justify-center font-semibold border border-border"
          style={{ fontSize: size * 0.38 }}
        >
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${
            online ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      )}
    </div>
  );
}
