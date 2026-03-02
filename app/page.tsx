import HomePageClient from "@/components/home/HomePageClient";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0] ?? null;
  }
  return null;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const auth = firstParam(params.auth);
  const redirect = firstParam(params.redirect);

  const initialAuthMode =
    auth === "login" || auth === "signup" ? auth : null;
  const redirectTo =
    redirect && redirect.startsWith("/") ? redirect : "/dashboard";

  return (
    <HomePageClient initialAuthMode={initialAuthMode} redirectTo={redirectTo} />
  );
}
