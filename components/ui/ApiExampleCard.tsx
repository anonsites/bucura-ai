"use client";

export default function ApiExampleCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#dce8df] bg-[#1e1e1e] shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#2d2d2d] px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-500"></div>
        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
        <div className="h-3 w-3 rounded-full bg-green-500"></div>
        <div className="ml-2 text-xs text-stone-400">api-example.js</div>
      </div>
      <div className="p-6 font-mono text-sm text-gray-300">
        <p>
          <span className="text-purple-400">const</span> response ={" "}
          <span className="text-purple-400">await</span> fetch(
          <span className="text-green-400">
            &quot;https://api.bucura.ai/chat&quot;
          </span>
          , {"{"}
        </p>
        <p className="pl-4">
          method: <span className="text-green-400">&quot;POST&quot;</span>,
        </p>
        <p className="pl-4">headers: {"{"}</p>
        <p className="pl-8">
          &quot;Authorization&quot;:{" "}
          <span className="text-green-400">&quot;Bearer sk_live_...&quot;</span>,
        </p>
        <p className="pl-8">
          &quot;Content-Type&quot;:{" "}
          <span className="text-green-400">&quot;application/json&quot;</span>
        </p>
        <p className="pl-4">{"}"},</p>
        <p className="pl-4">body: JSON.stringify({"{"}</p>
        <p className="pl-8">
          website_id: <span className="text-green-400">&quot;tenant_8f92a...&quot;</span>,
        </p>
        <p className="pl-8">
          message: <span className="text-green-400">&quot;How do I reset my password?&quot;</span>,
        </p>
        <p className="pl-8">
          user_id: <span className="text-green-400">&quot;visitor_123&quot;</span>
        </p>
        <p className="pl-4">{"}"})</p>
        <p>{"}"});</p>
        <br />
        <p><span className="text-gray-500">`// Response`</span></p>
        <p>{"{"}</p>
        <p className="pl-4">&quot;reply&quot;: <span className="text-green-400">&quot;You can reset it by...&quot;</span>,</p>
        <p className="pl-4">&quot;usage&quot;: {"{"} &quot;tokens&quot;: 42 {"}"}</p>
        <p>{"}"}</p>
      </div>
    </div>
  );
}