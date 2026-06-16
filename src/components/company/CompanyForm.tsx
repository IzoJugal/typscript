import { useParams } from "react-router-dom";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import CompanyRegister from "../auth/CompanyRegister";

function CompanyForm() {
    const { id } = useParams();
    return (
        <>
            <FormHeaderPaths page={id ? 'Edit Company' : 'Add Business'} prevLink='/business/1/' prevPage='Business' />
            <div className="container flex justify-center mx-auto">
                <CompanyRegister from="admin" />
            </div>

        </>
    );
}

export default CompanyForm;
