
function Loader() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200 bg-opacity-50 z-10">
            <img
                src="/images/loader.gif"
                alt="Loading..."
                className="w-10 h-10"
            />
        </div>
    )
}

export default Loader