import { useState, useEffect, useMemo } from "react";
import apiClient from "../../utils/AxiosInstance";

type Client = {
  id?: string | number;
  name: string;
  logo?: string;
};

export default function ClientsShow() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.get("/company/clients");
        if (!cancelled) {
          setClients(res?.data?.companies ?? []);
        }
      } catch (err: any) {
        console.error("Failed to load clients:", err?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const repeatedClients = useMemo(() => {
    if (clients.length === 0) return [];
    return [...clients, ...clients];
  }, [clients]);

  const duration = Math.max(18, clients.length * 2.5);

  const getGridCols = (len:number) => {
    if (len <= 1) return "grid-cols-1";
    if (len === 2) return "grid-cols-2";
    if (len === 3) return "grid-cols-3";
    if (len === 4) return "grid-cols-2 md:grid-cols-4";
    if (len === 5) return "grid-cols-2 md:grid-cols-5";
    return "grid-cols-2 md:grid-cols-3";
  };

  return (
    <section className="bg-[#f7f7f7] py-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="uppercase tracking-[0.3em] text-sm text-gray-500 mb-3">
            Trusted Worldwide
          </p>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Our Clients
          </h2>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-center text-gray-500">No clients available.</p>
        ) : clients.length < 6 ? (
          <div className={`grid gap-4 w-fit mx-auto ${getGridCols(clients.length)}`}>
            {clients.map((item, i) => (
              <CardLogo key={item.id ?? i} item={item} />
            ))}
          </div>
        ) : (
          /* Infinite Marquee */
          <div className="relative overflow-hidden marquee-mask">
            <div
              className="flex w-max gap-6 animate-marquee hover:[animation-play-state:paused]"
              style={{ animationDuration: `${duration}s` }}
            >
              {repeatedClients.map((item, i) => (
                <CardLogo key={`${item.id ?? item.name}-${i}`} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .animate-marquee {
          animation: marquee linear infinite;
        }

        .marquee-mask {
          mask-image: linear-gradient(
            to right,
            transparent,
            black 8%,
            black 92%,
            transparent
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent,
            black 8%,
            black 92%,
            transparent
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

function CardLogo({ item }: { item: Client }) {
  return (
    <div className="w-40 h-24 flex items-center justify-center shrink-0 overflow-hidden group">
      {item.logo ? (
        <img
          src={item.logo}
          alt={item.name}
          loading="lazy"
          className="h-24 w-auto object-contain duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center text-lg font-bold text-gray-700 uppercase">
          {item.name?.charAt(0)}
        </div>
      )}
    </div>
  );
}