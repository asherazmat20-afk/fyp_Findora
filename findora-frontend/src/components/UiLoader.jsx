function UiLoader({ text = "Loading..." }) {
    return (
      <div className="min-h-[40vh] flex flex-col justify-center items-center gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="text-sm text-slate-500">{text}</p>
      </div>
    );
  }
  
  export default UiLoader;