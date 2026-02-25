import Link from "next/link";

const VARIANTS = {
  primary: "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
  secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm",
  ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
};

export default function Button({ href, variant = "primary", className = "", children, ...props }) {
  const base = `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all ${VARIANTS[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button className={base} {...props}>
      {children}
    </button>
  );
}
