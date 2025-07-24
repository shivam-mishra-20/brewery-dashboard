'use client'

import React from 'react'

export default function FunctionalPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="allow-scroll">{children}</div>
}
