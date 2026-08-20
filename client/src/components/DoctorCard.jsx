import { Link } from "react-router-dom";

const DoctorCard = ({
    doctor
}) => {
    /*
     * IMPORTANT:
     *
     * The backend's sanitized doctor object
     * uses:
     *
     * doctor.profile.id
     *
     * as the DoctorProfile ID.
     *
     * This is the ID required by:
     *
     * GET /api/doctors/:id
     */
    const doctorId =
        doctor?.profile?.id;

    if (!doctorId) {
        console.error(
            "Doctor profile ID is missing:",
            doctor
        );

        return null;
    }

    const doctorName =
        doctor?.name ||
        "Doctor";

    const specialization =
        doctor?.profile
            ?.specialization ||
        "General Physician";

    const qualification =
        doctor?.profile
            ?.qualification ||
        "Qualified medical professional";

    const experience =
        doctor?.profile
            ?.experience ??
        0;

    const consultationFee =
        doctor?.profile
            ?.consultationFee ??
        0;

    const bio =
        doctor?.profile?.bio ||
        "Experienced healthcare professional.";

    return (
        <article className="doctor-card">
            <div className="doctor-avatar">
                {doctorName
                    .charAt(0)
                    .toUpperCase()}
            </div>

            <div className="doctor-info">
                <span className="doctor-specialization">
                    {specialization}
                </span>

                <h2>
                    Dr. {doctorName}
                </h2>

                <p>
                    {qualification}
                </p>

                <div className="doctor-meta">
                    <span>
                        {experience}{" "}
                        years experience
                    </span>

                    <span>
                        ₹
                        {consultationFee}
                    </span>
                </div>

                <p className="doctor-bio">
                    {bio}
                </p>

                <Link
                    to={`/patient/book/${doctorId}`}
                    className="primary-btn doctor-btn"
                >
                    View Availability
                </Link>
            </div>
        </article>
    );
};

export default DoctorCard;